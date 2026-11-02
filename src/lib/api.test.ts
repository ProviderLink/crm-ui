import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

type Api = typeof import('./api').default;
type Store = typeof import('@/store').store;
type Auth = typeof import('@/store/slices/authSlice');

let api: Api;
let store: Store;
let auth: Auth;

beforeAll(async () => {
  vi.stubEnv('VITE_API_URL', 'http://api.test/api/v1');
  api = (await import('./api')).default;
  store = (await import('@/store')).store;
  auth = await import('@/store/slices/authSlice');
});

/** What the fake server saw: the path and the token that came with it. */
type Call = { url: string; token: string };
let calls: Call[];
let location: { href: string };

const ok = (config: InternalAxiosRequestConfig, data: unknown) =>
  Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

const fail = (config: InternalAxiosRequestConfig, status: number) =>
  Promise.reject(
    new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, {
      data: {},
      status,
      statusText: '',
      headers: {},
      config,
    })
  );

/** A fake server: `route` answers each request, and every request is logged. */
function serve(
  route: (call: Call, config: InternalAxiosRequestConfig) => Promise<unknown>
) {
  const adapter: AxiosAdapter = config => {
    const call = {
      url: config.url ?? '',
      token: String(config.headers.get('Authorization') ?? ''),
    };
    calls.push(call);
    return route(call, config) as ReturnType<AxiosAdapter>;
  };
  api.defaults.adapter = adapter;
}

const refreshes = () =>
  calls.filter(c => c.url.includes('/auth/refresh-token'));

beforeEach(() => {
  calls = [];
  location = { href: '/dashboard' };
  vi.stubGlobal('location', location);
  store.dispatch(auth.clearAuth());
  store.dispatch(auth.setAccessToken('old'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('sends the access token with every request', async () => {
    serve((_c, config) => ok(config, { fine: true }));
    await api.get('/crm/assignments');
    expect(calls[0]?.token).toBe('Bearer old');
  });

  it('refreshes once on a 401 and replays the request with the new token', async () => {
    serve((call, config) => {
      if (call.url.includes('/auth/refresh-token'))
        return ok(config, { data: { accessToken: 'new' } });
      return call.token === 'Bearer new'
        ? ok(config, { n: 1 })
        : fail(config, 401);
    });

    const res = await api.get('/crm/assignments');

    expect(res.data).toEqual({ n: 1 });
    expect(refreshes()).toHaveLength(1);
    expect(store.getState().auth.accessToken).toBe('new');
    expect(calls.map(c => c.token)).toEqual([
      'Bearer old',
      'Bearer old',
      'Bearer new',
    ]);
  });

  it('shares one refresh between requests that fail together', async () => {
    serve((call, config) => {
      if (call.url.includes('/auth/refresh-token'))
        return ok(config, { data: { accessToken: 'new' } });
      return call.token === 'Bearer new' ? ok(config, {}) : fail(config, 401);
    });

    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    expect(refreshes()).toHaveLength(1);
    expect(calls.filter(c => c.token === 'Bearer new')).toHaveLength(3);
  });

  it('signs out and goes to login when the refresh fails', async () => {
    serve((_c, config) => fail(config, 401));

    await expect(api.get('/crm/assignments')).rejects.toBeTruthy();

    expect(store.getState().auth.accessToken).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(location.href).toBe('/login');
  });

  it('does not refresh for a wrong password', async () => {
    serve((_c, config) => fail(config, 401));

    await expect(api.post('/auth/login', {})).rejects.toBeTruthy();

    expect(refreshes()).toHaveLength(0);
    expect(location.href).toBe('/dashboard');
  });

  it('gives up when the replayed request is rejected again', async () => {
    serve((call, config) =>
      call.url.includes('/auth/refresh-token')
        ? ok(config, { data: { accessToken: 'new' } })
        : fail(config, 401)
    );

    await expect(api.get('/crm/assignments')).rejects.toBeTruthy();

    expect(refreshes()).toHaveLength(1);
  });

  it('leaves other errors alone', async () => {
    serve((_c, config) => fail(config, 500));

    await expect(api.get('/crm/assignments')).rejects.toBeTruthy();

    expect(refreshes()).toHaveLength(0);
  });
});
