import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only unmounts between tests by itself when the test
// framework exposes globals; this project imports from 'vitest' instead.
afterEach(cleanup);
