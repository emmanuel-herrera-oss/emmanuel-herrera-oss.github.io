// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

import mdx from '@astrojs/mdx';

import worker from '@astropub/worker'

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';


// https://astro.build/config
export default defineConfig({
  site: 'https://emmanuel-herrera-oss.github.io',
  integrations: [preact(), mdx(), worker()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
