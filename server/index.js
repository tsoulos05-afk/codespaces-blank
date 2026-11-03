import { createServer } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, '..');
const dataDirectory = path.resolve(projectRoot, process.env.SIDEQUEST_DATA_DIR || 'data');
const dataFile = path.join(dataDirectory, 'sidequest.json');
const sessionLifetime = 60 * 60 * 24 * 14;
const sessions = new Map();
const allowedTones = ['peach', 'mint', 'lemon', 'lilac'];
const projectStatuses = ['recruiting', 'in progress', 'completed', 'paused'];
let database = { users: [], projects: [], applications: [] };
let saveQueue = Promise.resolve();

await mkdir(dataDirectory, { recursive: true });
try {
  database = JSON.parse(await readFile(dataFile, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

function saveDatabase() {
  const contents = JSON.stringify(database, null, 2);
  saveQueue = saveQueue.then(async () => {
    const temporaryFile = `${dataFile}.${randomBytes(5).toString('hex')}.tmp`;
    await writeFile(temporaryFile, contents, { mode: 0o600 });
    await rename(temporaryFile, dataFile);
  });
  return saveQueue;
}

let projectsMigrated = false;
for (const project of database.projects) {
  if (!projectStatuses.includes(project.status)) {
    project.status = 'recruiting';
    projectsMigrated = true;
  }
}
if (projectsMigrated) await saveDatabase();

function publicUser(user) {
  const { id, name, university, bio, skills, interests, avatar, color, hoursPerWeek } = user;
  return { id, name, university, bio, skills, interests, avatar, color, hoursPerWeek };
}

function workspaceFor(user) {
  return {
    user: publicUser(user),
    users: database.users.map(publicUser),
    projects: [...database.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    applications: database.applications,
  };
}

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(value));
}

function cookiesFrom(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').map((cookie) => cookie.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value));
}

function sessionCookie(request, token, maxAge = sessionLifetime) {
  const forwardedHttps = request.headers['x-forwarded-proto']?.split(',')[0] === 'https';
  return `sidequest_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${forwardedHttps ? '; Secure' : ''}`;
}

function authenticatedUser(request) {
  const token = cookiesFrom(request).sidequest_session;
  const session = token && sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return database.users.find((user) => user.id === session.userId) || null;
}

async function requestBody(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 32_768) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanList(value, maxItems = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item, 48)).filter(Boolean))].slice(0, maxItems);
}

function colorFor(name) {
  const colors = ['coral', 'blue', 'green', 'yellow', 'purple'];
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length];
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

function createSession(user, request, response) {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionLifetime * 1000 });
  response.setHeader('Set-Cookie', sessionCookie(request, token));
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64);
}

function serveStatic(request, response, pathname) {
  const distDirectory = path.join(projectRoot, 'dist');
  const requestedPath = path.resolve(distDirectory, `.${decodeURIComponent(pathname)}`);
  if (requestedPath !== distDirectory && !requestedPath.startsWith(`${distDirectory}${path.sep}`)) {
    sendJson(response, 400, { error: 'Invalid path.' });
    return;
  }
  const mimeTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  stat(requestedPath).then((fileStat) => {
    const file = fileStat.isFile() ? requestedPath : path.join(distDirectory, 'index.html');
    return readFile(file).then((contents) => {
      response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
      response.end(contents);
    });
  }).catch(() => readFile(path.join(distDirectory, 'index.html')).then((contents) => {
    response.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
    response.end(contents);
  }).catch(() => sendJson(response, 404, { error: 'App is not built yet. Run npm run build first.' })));
}

async function handleRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const pathname = url.pathname;
  if (pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (pathname === '/api/auth/register' && request.method === 'POST') {
    const body = await requestBody(request);
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const university = cleanText(body.university, 120);
    const password = typeof body.password === 'string' ? body.password : '';
    if (name.length < 2 || !email.includes('@') || university.length < 2 || password.length < 8) {
      sendJson(response, 400, { error: 'Enter your name, a valid email, your university, and a password with at least 8 characters.' });
      return;
    }
    if (database.users.some((user) => user.email === email)) {
      sendJson(response, 409, { error: 'An account with that email already exists.' });
      return;
    }
    const salt = randomBytes(16).toString('hex');
    const user = {
      id: randomBytes(16).toString('hex'), name, email, university, bio: '', skills: [], interests: [],
      hoursPerWeek: null, avatar: initials(name), color: colorFor(name), passwordSalt: salt, passwordHash: hashPassword(password, salt).toString('hex'),
    };
    database.users.push(user);
    await saveDatabase();
    createSession(user, request, response);
    sendJson(response, 201, workspaceFor(user));
    return;
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const body = await requestBody(request);
    const email = cleanText(body.email, 254).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const user = database.users.find((item) => item.email === email);
    const candidate = user ? hashPassword(password, user.passwordSalt) : Buffer.alloc(64);
    const savedHash = user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64);
    if (!user || !timingSafeEqual(candidate, savedHash)) {
      sendJson(response, 401, { error: 'That email and password combination didn’t work.' });
      return;
    }
    createSession(user, request, response);
    sendJson(response, 200, workspaceFor(user));
    return;
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    const token = cookiesFrom(request).sidequest_session;
    if (token) sessions.delete(token);
    sendJson(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie(request, '', 0) });
    return;
  }

  if (!pathname.startsWith('/api/')) {
    if (request.method === 'GET') serveStatic(request, response, pathname);
    else sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  const user = authenticatedUser(request);
  if (!user) {
    sendJson(response, 401, { error: 'Please log in to continue.' });
    return;
  }

  if (pathname === '/api/workspace' && request.method === 'GET') {
    sendJson(response, 200, workspaceFor(user));
    return;
  }

  if (pathname === '/api/profile' && request.method === 'PATCH') {
    const body = await requestBody(request);
    const name = cleanText(body.name, 80);
    const university = cleanText(body.university, 120);
    const hoursPerWeek = Number(body.hoursPerWeek);
    if (name.length < 2 || university.length < 2 || !Number.isInteger(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
      sendJson(response, 400, { error: 'Name, university, and weekly availability from 1 to 80 hours are required.' });
      return;
    }
    Object.assign(user, {
      name, university, bio: cleanText(body.bio, 220), skills: cleanList(body.skills), interests: cleanList(body.interests),
      hoursPerWeek, avatar: initials(name), color: colorFor(name),
    });
    await saveDatabase();
    sendJson(response, 200, workspaceFor(user));
    return;
  }

  if (pathname === '/api/projects' && request.method === 'POST') {
    const body = await requestBody(request);
    const title = cleanText(body.title, 60);
    const description = cleanText(body.description, 400);
    const tags = cleanList(body.tags);
    const roles = cleanList(body.roles);
    const hoursPerWeek = Number(body.hoursPerWeek);
    if (title.length < 3 || description.length < 20 || !tags.length || !roles.length || !Number.isInteger(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
      sendJson(response, 400, { error: 'Add a title, description, interest tag, role or skill, and a weekly commitment from 1 to 80 hours.' });
      return;
    }
    database.projects.push({
      id: randomBytes(16).toString('hex'), ownerId: user.id, title, description, tags, roles, hoursPerWeek, members: [],
      createdAt: new Date().toISOString().slice(0, 10), tone: allowedTones[Math.floor(Math.random() * allowedTones.length)], status: 'recruiting',
    });
    await saveDatabase();
    sendJson(response, 201, workspaceFor(user));
    return;
  }

  const projectRoute = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectRoute && request.method === 'PATCH') {
    const project = database.projects.find((item) => item.id === projectRoute[1]);
    if (!project) {
      sendJson(response, 404, { error: 'Project not found.' });
      return;
    }
    if (project.ownerId !== user.id) {
      sendJson(response, 403, { error: 'Only the project creator can edit this project.' });
      return;
    }
    const body = await requestBody(request);
    const updatedProject = { ...project };
    if (Object.hasOwn(body, 'status')) {
      if (!projectStatuses.includes(body.status)) {
        sendJson(response, 400, { error: 'Choose recruiting, in progress, completed, or paused.' });
        return;
      }
      updatedProject.status = body.status;
    }
    if (['title', 'description', 'tags', 'roles', 'hoursPerWeek'].some((key) => Object.hasOwn(body, key))) {
      const title = cleanText(body.title ?? project.title, 60);
      const description = cleanText(body.description ?? project.description, 400);
      const tags = cleanList(body.tags ?? project.tags);
      const roles = cleanList(body.roles ?? project.roles);
      const hoursPerWeek = Number(body.hoursPerWeek ?? project.hoursPerWeek);
      if (title.length < 3 || description.length < 20 || !tags.length || !roles.length || !Number.isInteger(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
        sendJson(response, 400, { error: 'Add a title, description, interest tag, role or skill, and a weekly commitment from 1 to 80 hours.' });
        return;
      }
      Object.assign(updatedProject, { title, description, tags, roles, hoursPerWeek });
    }
    Object.assign(project, updatedProject);
    await saveDatabase();
    sendJson(response, 200, workspaceFor(user));
    return;
  }

  const applicationRoute = pathname.match(/^\/api\/projects\/([^/]+)\/applications$/);
  if (applicationRoute && request.method === 'POST') {
    const project = database.projects.find((item) => item.id === applicationRoute[1]);
    if (!project) {
      sendJson(response, 404, { error: 'Project not found.' });
      return;
    }
    if (project.ownerId === user.id) {
      sendJson(response, 400, { error: 'You cannot apply to your own project.' });
      return;
    }
    if (project.status !== 'recruiting') {
      sendJson(response, 400, { error: 'This project is not currently accepting applications.' });
      return;
    }
    if (database.applications.some((item) => item.projectId === project.id && item.applicantId === user.id)) {
      sendJson(response, 409, { error: 'You have already applied to this project.' });
      return;
    }
    const body = await requestBody(request);
    const role = cleanText(body.role, 48);
    const message = cleanText(body.message, 300);
    if (!project.roles.includes(role) || message.length < 8) {
      sendJson(response, 400, { error: 'Choose one of the listed roles and write a short introduction.' });
      return;
    }
    database.applications.push({ id: randomBytes(16).toString('hex'), projectId: project.id, applicantId: user.id, role, message, status: 'pending', createdAt: new Date().toISOString().slice(0, 10) });
    await saveDatabase();
    sendJson(response, 201, workspaceFor(user));
    return;
  }

  const reviewRoute = pathname.match(/^\/api\/applications\/([^/]+)$/);
  if (reviewRoute && request.method === 'PATCH') {
    const application = database.applications.find((item) => item.id === reviewRoute[1]);
    const project = application && database.projects.find((item) => item.id === application.projectId);
    if (!application || !project) {
      sendJson(response, 404, { error: 'Application not found.' });
      return;
    }
    if (project.ownerId !== user.id) {
      sendJson(response, 403, { error: 'Only the project creator can review this application.' });
      return;
    }
    const body = await requestBody(request);
    if (!['accepted', 'declined'].includes(body.status)) {
      sendJson(response, 400, { error: 'Choose accepted or declined.' });
      return;
    }
    application.status = body.status;
    if (body.status === 'accepted' && !project.members.includes(application.applicantId)) project.members.push(application.applicantId);
    await saveDatabase();
    sendJson(response, 200, workspaceFor(user));
    return;
  }

  sendJson(response, 404, { error: 'API route not found.' });
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) sendJson(response, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' });
    else response.destroy();
  });
});

const port = Number(process.env.API_PORT || 3001);
server.listen(port, '0.0.0.0', () => console.log(`Sidequest API listening on http://localhost:${port}`));