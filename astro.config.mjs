// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  Site: 'https://emmanuel-herrera-oss.github.io',
  integrations: [preact(), mdx()]
});