import { z } from 'zod'

// The CSP has no 'unsafe-eval'. Zod probes for eval with `new Function('')` and falls back when it
// throws, but the browser still reports that probe as a CSP violation. jitless skips the probe.
// Import this module first in main.tsx, before any schema is created.
z.config({ jitless: true })
