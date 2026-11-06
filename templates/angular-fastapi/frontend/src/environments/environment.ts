// Backend API base URL. Change it here (or per environment) to point the
// app at another FastAPI instance. Default: local development server.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:{{BACKEND_PORT}}',
};
