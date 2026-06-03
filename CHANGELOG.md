## [1.18.4](https://github.com/ferdifir/kapster/compare/v1.18.3...v1.18.4) (2026-06-03)


### Bug Fixes

* **admin:** server action must return void for form action ([02de433](https://github.com/ferdifir/kapster/commit/02de4332d5413817b5cb54f3131d9db0c775d4dd))

## [1.18.3](https://github.com/ferdifir/kapster/compare/v1.18.2...v1.18.3) (2026-06-03)


### Bug Fixes

* **admin:** remove email from profiles select, no such column ([ccd7672](https://github.com/ferdifir/kapster/commit/ccd767244c620fa86477c843a1202ba54abec50a))

## [1.18.2](https://github.com/ferdifir/kapster/compare/v1.18.1...v1.18.2) (2026-06-03)


### Bug Fixes

* **admin:** queue_entries query via queue_ids, no barbershop_id col ([dff68db](https://github.com/ferdifir/kapster/commit/dff68db6b9292922d6ae637f6443ca847406b94b))

## [1.18.1](https://github.com/ferdifir/kapster/compare/v1.18.0...v1.18.1) (2026-06-03)


### Bug Fixes

* **admin:** add exec_sql to Supabase types ([52821af](https://github.com/ferdifir/kapster/commit/52821af513a0760ca7a38702e60459d17f2c05cf))

# [1.18.0](https://github.com/ferdifir/kapster/compare/v1.17.3...v1.18.0) (2026-06-03)


### Bug Fixes

* **admin:** lock down exec_sql function to service_role only ([194f443](https://github.com/ferdifir/kapster/commit/194f4433e4734cdce6d0368ed5783f68f4ecfa4f))
* **admin:** resolve process.cwd() client-side bug, fix file read/write paths ([f2e0b11](https://github.com/ferdifir/kapster/commit/f2e0b11a2ad23c62702db12fb6084863c6ac8b5e))


### Features

* **admin:** add admin auth library ([e16daed](https://github.com/ferdifir/kapster/commit/e16daedcd1cf5b782463132f973ff8c19af3eac3))
* **admin:** add admin layout, sidebar, and header ([6ffe493](https://github.com/ferdifir/kapster/commit/6ffe4933d311a79891993516db2533eda6857639))
* **admin:** add barbershop and user management pages ([bd72e55](https://github.com/ferdifir/kapster/commit/bd72e558b9049520776fb365c13c9fcce50b257c))
* **admin:** add dashboard redirect and KPIs ([5223bca](https://github.com/ferdifir/kapster/commit/5223bca406aa0c732ce48e5863f8199449cd27e1))
* **admin:** add SQL query runner ([003e904](https://github.com/ferdifir/kapster/commit/003e9043950ab7544a8f4a0b7d4c6a613b2c8ab8))
* **admin:** add system health, terminal, file manager, and SEO audit ([93e9763](https://github.com/ferdifir/kapster/commit/93e976386cf030e2d27839a557dba9401c0f6efd))
* **admin:** add telegram bot /admin command and init endpoint ([819fda7](https://github.com/ferdifir/kapster/commit/819fda78e625c9ee96762c3e9f2e4c7c492f6c5b))
* **admin:** add telegram_id migration and env vars ([03cf4ac](https://github.com/ferdifir/kapster/commit/03cf4ac707d6b2bb3c93792900363637caf2b580))

## [1.17.3](https://github.com/ferdifir/kapster/compare/v1.17.2...v1.17.3) (2026-06-03)


### Bug Fixes

* enhance SEO audit with content depth, keywords, H2 substance, schema validation, GSC weighting ([4b79f15](https://github.com/ferdifir/kapster/commit/4b79f15571bc016d27144a6f13a09065fe3b04e0))

## [1.17.2](https://github.com/ferdifir/kapster/compare/v1.17.1...v1.17.2) (2026-06-03)


### Bug Fixes

* multi-model fallback for SEO audit LLM calls ([d0e12d5](https://github.com/ferdifir/kapster/commit/d0e12d570afca40c5a7a51908087787035f44be1))

## [1.17.1](https://github.com/ferdifir/kapster/compare/v1.17.0...v1.17.1) (2026-06-03)


### Bug Fixes

* self-contained migration script, prevent main() on import ([72c6f46](https://github.com/ferdifir/kapster/commit/72c6f46e0fb7d5c62918330cc039027cb2f0c58d))

# [1.17.0](https://github.com/ferdifir/kapster/compare/v1.16.0...v1.17.0) (2026-06-03)


### Features

* add SEO migration script for existing posts ([f52b8dd](https://github.com/ferdifir/kapster/commit/f52b8dd0a68addbabf6e535783acc2a1bec3cd6f))

# [1.16.0](https://github.com/ferdifir/kapster/compare/v1.15.0...v1.16.0) (2026-06-03)


### Bug Fixes

* 3-loop continuation with better prompt + shorter slug suffix ([fb4ce54](https://github.com/ferdifir/kapster/commit/fb4ce545877b2bd25bc7104ff76eaae0c275bc03))
* add POST handler to cron + unique index to prevent race conditions ([0ec0546](https://github.com/ferdifir/kapster/commit/0ec05464af97d8f20703a870c0ae7016e7d4e0f1))
* address code review issues in demo.ts ([1afa3af](https://github.com/ferdifir/kapster/commit/1afa3af1324fee5687fec8335e0b4d2d963c610c))
* continuation prompt with heading structure + excerpt fallback ([59aa1ca](https://github.com/ferdifir/kapster/commit/59aa1ca40860f93ae4e71b7959286650f1656fe5))
* enforce 3000+ word blog articles with continuation retry ([683aa60](https://github.com/ferdifir/kapster/commit/683aa605c4eda25626b914f3c6a36b86bbf65072))
* robust metadata parsing - handle ---\nMETADATA format ([4382e5e](https://github.com/ferdifir/kapster/commit/4382e5e7c920b21cf0b50061a7d9d60a6316139f))
* update Groq model list, remove small TPM models from generation ([effa5c1](https://github.com/ferdifir/kapster/commit/effa5c1b15b66400844946f9cd08bdf8b852638b))


### Features

* add core demo logic (lib/demo.ts) ([4551c24](https://github.com/ferdifir/kapster/commit/4551c241e464f855204a9d8afa45dea720c27dda))
* add cron endpoint for demo session cleanup ([34b5239](https://github.com/ferdifir/kapster/commit/34b5239c9776cb4fff2e3cd9b3577fbfe54c05cc))
* add demo_sessions and demo_waitlist tables ([e69d176](https://github.com/ferdifir/kapster/commit/e69d1768cc79045177467cf6e41d551b0cf2389c))
* add Ollama Cloud as 3rd LLM fallback provider ([14d091e](https://github.com/ferdifir/kapster/commit/14d091e9327221446cf10d62ccb6accf4f160e8d))
* add private message handler for demo requests ([383f3d2](https://github.com/ferdifir/kapster/commit/383f3d291ee05f1c8be43fc83d139ada3fc4f26e))
* enrich SEO - schema, internal links, LLM metadata, 4-loop continuation ([0a1548d](https://github.com/ferdifir/kapster/commit/0a1548d31e2d237a4c85c7a08bc22429d26e1c66))
* improve blog content prompts for SEO - specificity, depth, misspelling coverage ([66a164f](https://github.com/ferdifir/kapster/commit/66a164fdcb0f049b892b65c7b4d8e20611c1515c))
* multi-model fallback per provider (4 Groq + 3 OpenRouter models) ([638ad2d](https://github.com/ferdifir/kapster/commit/638ad2d05252bffc21d1e197ed523f24266761ec))
* multi-provider LLM with Groq→OpenRouter fallback ([87dad07](https://github.com/ferdifir/kapster/commit/87dad0712b0625ac183357426e92f539f2c13080))
* schedule demo cleanup cron every 60s ([91a1ff7](https://github.com/ferdifir/kapster/commit/91a1ff768db06dcc75f4fe2f36ffb2c3b5b4d6ea))

# [1.15.0](https://github.com/ferdifir/kapster/compare/v1.14.1...v1.15.0) (2026-06-02)


### Bug Fixes

* add date filter to QA score query and use shared sendTelegramMessage ([da5e7f6](https://github.com/ferdifir/kapster/commit/da5e7f69bde96e3c2e34ab4bfd50f264d5456837))
* add FK relationship in types and IF NOT EXISTS in migration ([b99ec79](https://github.com/ferdifir/kapster/commit/b99ec7959de58c950aacc1ba43fd5b58882d0960))
* check HTTP status, guard empty URLs, wrap Telegram in try/catch, improve meta regex ([a42fbd3](https://github.com/ferdifir/kapster/commit/a42fbd3d718d884faf1998be0f12767e8a6ff4f0))
* prevent NaN score and skip unnecessary regen on QA failure ([4b8a396](https://github.com/ferdifir/kapster/commit/4b8a396d91290ab8bbafde25c32acce63b22d8bb))
* propagate Trend-Pulse errors and filter empty keywords ([aa9e548](https://github.com/ferdifir/kapster/commit/aa9e5485dd0d254d97222d3b7dc4e294bd4c7794))


### Features

* add content_plan_id to blog_posts for plan tracking ([b1aa4b3](https://github.com/ferdifir/kapster/commit/b1aa4b3297a07864be19b69c9de4ddfb4d842fa8))
* **blog:** add QA review with auto-regen for blog content ([628ff71](https://github.com/ferdifir/kapster/commit/628ff7173c3645ecb93ce72d46e48b847a2e29f6))
* **blog:** data-driven research with GSC, Trend-Pulse, and MCP ([8e0edcd](https://github.com/ferdifir/kapster/commit/8e0edcd0956870f8fc98ce88d04ba6435e165a2f))
* **seo:** add SEO audit cron endpoint ([ff39509](https://github.com/ferdifir/kapster/commit/ff395091e3c5caebc567601cedbbaf6d3b067087))
* **seo:** add SEO audit script with HTML parsing, PSI, and LLM analysis ([28b819a](https://github.com/ferdifir/kapster/commit/28b819a5847ce9b156cc2836dc89e2ef056b782e))

## [1.14.1](https://github.com/ferdifir/kapster/compare/v1.14.0...v1.14.1) (2026-06-02)


### Bug Fixes

* use try/catch for supabase upsert (API has no .catch method) ([f6047ad](https://github.com/ferdifir/kapster/commit/f6047ad80b6efd095bcd4ab7a7dfa8ddf4013201))

# [1.14.0](https://github.com/ferdifir/kapster/compare/v1.13.1...v1.14.0) (2026-06-02)


### Features

* add quality monitoring and Telegram alerts for content degradation ([1793a5c](https://github.com/ferdifir/kapster/commit/1793a5c630fc8ead04df343419079e121c8da131))
* add research cron endpoint, update generate cron endpoint ([c95cb52](https://github.com/ferdifir/kapster/commit/c95cb5260acd80012cbf9497d2ffdf2bfe20c4c4))
* split generate script into research mode and generate mode ([4686a04](https://github.com/ferdifir/kapster/commit/4686a0474187a177389b5db9731b88421aab9a23))

## [1.13.1](https://github.com/ferdifir/kapster/compare/v1.13.0...v1.13.1) (2026-06-02)


### Bug Fixes

* add generic words to COMMON_WORDS dedup set ([c449bf9](https://github.com/ferdifir/kapster/commit/c449bf98cf1daa52fb244c2de5966af8f410da5b))

# [1.13.0](https://github.com/ferdifir/kapster/compare/v1.12.0...v1.13.0) (2026-06-02)


### Bug Fixes

* add missing execFile import ([47a1adf](https://github.com/ferdifir/kapster/commit/47a1adfa2e8e63aba4ec0318617e6311213e2663))
* change contents from const to let for dedup filter ([39f64cf](https://github.com/ferdifir/kapster/commit/39f64cf7da38baa6664c321460c5c6c7b201ee80))
* dedup filter out common barbershop words, require 2 unique matches ([b62be28](https://github.com/ferdifir/kapster/commit/b62be28e7d0da2fd00a798116e082e9e59391a53))
* fallback QA to Groq if Ollama fails ([248c394](https://github.com/ferdifir/kapster/commit/248c394c31c37b155da3acf8512cf9b9a68ec8eb))
* ollama ToolCall type cast ([09b9cb2](https://github.com/ferdifir/kapster/commit/09b9cb21a67996260974fe8e8fecc1476c033798))
* replace Ollama QA with OpenRouter (gpt-oss-120b:free) ([7a7b0dc](https://github.com/ferdifir/kapster/commit/7a7b0dcf2a52eac2ae90c174348ce64421be45a5))
* use bigram overlap for dedup — req 1 unique 2-word phrase match ([eb6d96c](https://github.com/ferdifir/kapster/commit/eb6d96cd8eca389bb7f09541f8cfcd432e3eedb7))


### Features

* dedup layer 3 — skip save if topic >50% word overlap with 14d history ([2eeeb5f](https://github.com/ferdifir/kapster/commit/2eeeb5f8b78fb5a328d5d4d9efbac9af010289da))
* dedup topics — fetch recent posts, prompt LLM to avoid repeats ([11ae1df](https://github.com/ferdifir/kapster/commit/11ae1df5593bfde8e9d574c43b15586e214e7514))
* trend-pulse real-time trend research + llm curation ([6cd61bf](https://github.com/ferdifir/kapster/commit/6cd61bf1b68f694f40513e429ace4d9a4d22b953))

# [1.12.0](https://github.com/ferdifir/kapster/compare/v1.11.0...v1.12.0) (2026-06-02)


### Features

* add Ollama Cloud client lib (missing from prev commit) ([752d2ba](https://github.com/ferdifir/kapster/commit/752d2ba86ad948997eb14d7e255a74d670bc6272))

# [1.11.0](https://github.com/ferdifir/kapster/compare/v1.10.2...v1.11.0) (2026-06-02)


### Features

* auto QA review via Ollama Cloud with regen on low score ([38c658c](https://github.com/ferdifir/kapster/commit/38c658cf0dae5dc7ef32441c744609a423e8b1ef))

## [1.10.2](https://github.com/ferdifir/kapster/compare/v1.10.1...v1.10.2) (2026-06-02)


### Bug Fixes

* add JSON code block stripping, enforce SAJA in prompt ([504d30d](https://github.com/ferdifir/kapster/commit/504d30d3bcb2bb61017fd12b995cc484282ca552))

## [1.10.1](https://github.com/ferdifir/kapster/compare/v1.10.0...v1.10.1) (2026-06-02)


### Bug Fixes

* better hook prompt based on research ([23d551e](https://github.com/ferdifir/kapster/commit/23d551e3fc043bbfbf2e1ef44c07e6dde56414b1))

# [1.10.0](https://github.com/ferdifir/kapster/compare/v1.9.0...v1.10.0) (2026-06-02)


### Bug Fixes

* trend_analysis merge, move extractDescription before usage ([073e26d](https://github.com/ferdifir/kapster/commit/073e26d1893f0f2b88e272bfad343c2e6a817b60))


### Features

* add /konten command handler to Telegram webhook ([9752b16](https://github.com/ferdifir/kapster/commit/9752b161ae7116e369fbc725b4db521a60680019))
* add CLI args to social content gen, fix pillar/prompt system ([40c7561](https://github.com/ferdifir/kapster/commit/40c756107bc23df3fbdda62538754876ec5634f9))

# [1.9.0](https://github.com/ferdifir/kapster/compare/v1.8.0...v1.9.0) (2026-06-01)


### Features

* save post_url via Telegram reply for social content analytics ([43dfb90](https://github.com/ferdifir/kapster/commit/43dfb90ea03947a86e8df2594c7e02e606aaf9a0))

# [1.8.0](https://github.com/ferdifir/kapster/compare/v1.7.0...v1.8.0) (2026-06-01)


### Features

* show social media username instead of pillar badge in card ([1cc0ad0](https://github.com/ferdifir/kapster/commit/1cc0ad0974ea2f89c4481a421541199c18e30106))

# [1.7.0](https://github.com/ferdifir/kapster/compare/v1.6.6...v1.7.0) (2026-06-01)


### Features

* redesigned card with scissors logo, link button, title+desc+CTA ([43de550](https://github.com/ferdifir/kapster/commit/43de55063fcb897cee6c01e56f39b5e553511484))

## [1.6.6](https://github.com/ferdifir/kapster/compare/v1.6.5...v1.6.6) (2026-06-01)


### Bug Fixes

* dynamic Google Fonts URL via CSS API ([9182d36](https://github.com/ferdifir/kapster/commit/9182d36b047b5be5c612b1a0662a002d98eec44c))

## [1.6.5](https://github.com/ferdifir/kapster/compare/v1.6.4...v1.6.5) (2026-06-01)


### Bug Fixes

* cast trend_analysis for TS strict JSON type ([1efe0d6](https://github.com/ferdifir/kapster/commit/1efe0d632678ee872fe9f59913facd5dfab8b552))

## [1.6.4](https://github.com/ferdifir/kapster/compare/v1.6.3...v1.6.4) (2026-06-01)


### Bug Fixes

* ts-expect-error for JSONB update ([9a8d24b](https://github.com/ferdifir/kapster/commit/9a8d24b3cfddb35d79d5aed730180c60ff8b232f))

## [1.6.3](https://github.com/ferdifir/kapster/compare/v1.6.2...v1.6.3) (2026-06-01)


### Bug Fixes

* fetch trend_analysis from DB before update ([1e13d78](https://github.com/ferdifir/kapster/commit/1e13d783e2dad25afb719b6282ff68f4161d0ac3))

## [1.6.2](https://github.com/ferdifir/kapster/compare/v1.6.1...v1.6.2) (2026-06-01)


### Bug Fixes

* rename to .tsx for JSX support ([03bd91c](https://github.com/ferdifir/kapster/commit/03bd91c76cd5fc072e0a2cb3a472f1fdd72e7fb1))

## [1.6.1](https://github.com/ferdifir/kapster/compare/v1.6.0...v1.6.1) (2026-06-01)


### Bug Fixes

* Buffer to Uint8Array for Blob type compatibility ([d5e22f0](https://github.com/ferdifir/kapster/commit/d5e22f0adc60b8262a4074e6672ed644ffa3ec89))

# [1.6.0](https://github.com/ferdifir/kapster/compare/v1.5.0...v1.6.0) (2026-06-01)


### Features

* social card image via satori + resvg, Telegram photo, rate limiting ([edbd0ca](https://github.com/ferdifir/kapster/commit/edbd0ca0e7458f2f7267acec4fbbdd645eaa669e))

# [1.5.0](https://github.com/ferdifir/kapster/compare/v1.4.0...v1.5.0) (2026-06-01)


### Features

* add Telegram inline buttons for social post status tracking ([7d679fd](https://github.com/ferdifir/kapster/commit/7d679fda0ffc7d8be509382faea666d96342c7ed))

# [1.4.0](https://github.com/ferdifir/kapster/compare/v1.3.2...v1.4.0) (2026-06-01)


### Bug Fixes

* blog generator full end-to-end flow ([b3663f7](https://github.com/ferdifir/kapster/commit/b3663f79b7245c0d4efe48fd04b0d3f0e4854b33))
* merge SEO metadata into article gen to reduce Groq API calls ([bf11502](https://github.com/ferdifir/kapster/commit/bf11502823322432f1bc3788743ee3d1cab335b6))


### Features

* add API route for social content cron trigger ([af9bbab](https://github.com/ferdifir/kapster/commit/af9bbabf615cea776f1116d0938a5254aec0b428))
* add daily cron job for social content generation ([4d98a9d](https://github.com/ferdifir/kapster/commit/4d98a9dca118ea4e138446c4b8f133e4c269a9ff))
* add social content generation script ([007127f](https://github.com/ferdifir/kapster/commit/007127f14c276077d7fee0f059da1a7a34020fbd))
* add social_posts table for social media content generation ([ea486bc](https://github.com/ferdifir/kapster/commit/ea486bc01a4bb89d74295b3191d4b74284c1b88d))
* blog UX improvements, anchor fixes, deploy path, Puter AI image gen ([fd299be](https://github.com/ferdifir/kapster/commit/fd299be06a101a99a54f4622d8e698cf4d27f438))

## [1.3.2](https://github.com/ferdifir/kapster/compare/v1.3.1...v1.3.2) (2026-05-31)


### Bug Fixes

* remove Puter API key dependency, image gen optional ([3c82f87](https://github.com/ferdifir/kapster/commit/3c82f8733c4b445ba8f09da0e8e4950bc52d7e8c))

## [1.3.1](https://github.com/ferdifir/kapster/compare/v1.3.0...v1.3.1) (2026-05-31)


### Bug Fixes

* use admin client in getAllPublishedSlugs for build-time compat ([1636101](https://github.com/ferdifir/kapster/commit/16361013c9fe87774eee684315b5c1eb38691b0c))

# [1.3.0](https://github.com/ferdifir/kapster/compare/v1.2.0...v1.3.0) (2026-05-31)


### Bug Fixes

* type-safe updateBlogPostStatus ([35b4e93](https://github.com/ferdifir/kapster/commit/35b4e93e29372e5ec3b1a6418979c0bdb1dcf2bd))


### Features

* add cron API endpoint and pg_cron migration ([7dad760](https://github.com/ferdifir/kapster/commit/7dad76079fb3dda388cbd5b5ecb0b2bf5477ab75))

# [1.2.0](https://github.com/ferdifir/kapster/compare/v1.1.0...v1.2.0) (2026-05-31)


### Features

* add blog content generator script ([e4fd854](https://github.com/ferdifir/kapster/commit/e4fd854ba74e64a2160fba8526f269bf29992ed8))
* add blog list and detail pages ([fd33c3d](https://github.com/ferdifir/kapster/commit/fd33c3de1fa2bd1f8a8cf6c74f1d48f7c0dcc698))
* add blog posts to sitemap ([ddcf7d6](https://github.com/ferdifir/kapster/commit/ddcf7d644a7b7131aa57ebf57bb821e10a9141c1))
* add blog_posts table ([39ec3bf](https://github.com/ferdifir/kapster/commit/39ec3bf0b246ac7f2e7cb0b020428f90ad0ec10f))
* add blog_posts types and blog utility library ([3df0666](https://github.com/ferdifir/kapster/commit/3df066603f259e0c08196c50463f953701348e35))
* add MCP content-researcher server with web search and fetch tools ([4228cc2](https://github.com/ferdifir/kapster/commit/4228cc23543e77b32793704c725dd2abd34abc0c))
* add telegram inline keyboard support and blog webhook ([7a5cd79](https://github.com/ferdifir/kapster/commit/7a5cd790ac3bc90ec445d7ae1e09e9fadc8c4af3))

# [1.1.0](https://github.com/ferdifir/kapster/compare/v1.0.0...v1.1.0) (2026-05-31)


### Features

* add groq client ([2357117](https://github.com/ferdifir/kapster/commit/23571173901bb03906f3c186396a8e63e8bfde9d))
* add groq client ([8f24bea](https://github.com/ferdifir/kapster/commit/8f24bea926596c7dcf6e2760fc6352549e620d32))
* add whatsapp bot processor ([b2e48a2](https://github.com/ferdifir/kapster/commit/b2e48a2ef736e1ce2c86280c0c0551babe063aaa))
* add whatsapp bot processor ([16577f6](https://github.com/ferdifir/kapster/commit/16577f6729d16b1c62f2b094654f6079ff7afd6b))
* add whatsapp webhook endpoint ([398ec16](https://github.com/ferdifir/kapster/commit/398ec160281cecd21a6647757076dc35601d90c1))
* add whatsapp webhook endpoint ([d8c3314](https://github.com/ferdifir/kapster/commit/d8c3314a9d747a3bb551ac35c55a4c41f12f964d))

# 1.0.0 (2026-05-31)


### Bug Fixes

* add auth check, fix type mismatch, add error handling for booking_max_days ([9854281](https://github.com/ferdifir/kapster/commit/9854281255222ae6c7d795a40e81d6b8f3552742))
* add barbershops prop sync effect, pass mapcn ref, add script load timeout in MapView ([1a20f15](https://github.com/ferdifir/kapster/commit/1a20f1517a4bdb29d2f93ffaf834d495bdbabf51))
* add bg-dark-950, Navbar, and Footer to public map page ([90cd672](https://github.com/ferdifir/kapster/commit/90cd672d6549d5add1772c1e09caa1ea7237baa1))
* add dangerouslyAllowLocalIP for NAT64 IPv6 image resolution ([b4d009b](https://github.com/ferdifir/kapster/commit/b4d009be6f54e83fd5f7ee52331a58a4f6c9705e))
* add data-testid and sync marker on prop change in MapPicker ([9cb779b](https://github.com/ferdifir/kapster/commit/9cb779be9e29ef20375c8adf88bd33e17389bb58))
* add data-testid to MapView container ([a4c007a](https://github.com/ferdifir/kapster/commit/a4c007ae7985e89737350173ad3d92808c8ab4de))
* add disallow rules to AI bot robots entry ([976db47](https://github.com/ferdifir/kapster/commit/976db476757d958be5473cb42e54285dd0d19cc9))
* add git pull to deploy, shorten meta description, reduce keyword density ([367866b](https://github.com/ferdifir/kapster/commit/367866b58dd93208f596afeb169e7f94acc64cb9))
* add loading state, error handling, and force-dynamic to billing page ([73078bc](https://github.com/ferdifir/kapster/commit/73078bc4ee74a3fb13c9898c0f93920cd6f95f44))
* add location error display, auto-clear saved state, remove redundant null coalescing in SettingsForm ([4fb66c4](https://github.com/ferdifir/kapster/commit/4fb66c4cf469b726986502e3865db641b5307411))
* add map cleanup, typed refs, script dedup, and stable callback ref in MapPicker ([de9f228](https://github.com/ferdifir/kapster/commit/de9f228b478c52a4c00ca4527cbe3b9239a23637))
* add middleware debug header ([ba345e6](https://github.com/ferdifir/kapster/commit/ba345e61aac1700b941f543a0fcd7588abbed9a1))
* add null check after upsert, validate customer name not empty ([4098ac5](https://github.com/ferdifir/kapster/commit/4098ac54bb98df330a858a5e3242646273141c6a))
* add OSM tile and nominatim to CSP header ([b0cabdb](https://github.com/ferdifir/kapster/commit/b0cabdbce967b7fb73ffcdb959316371b513b033))
* add OSM tile domains to both proxy.ts and next.config.ts CSP ([da5d201](https://github.com/ferdifir/kapster/commit/da5d201caa0f29153a14cdf8ed80c8b783e80ee1))
* add OSM tile domains to CSP in next.config.ts (middleware/proxy deprecated) ([a1d8698](https://github.com/ferdifir/kapster/commit/a1d8698673183c1578434a2ddd5e2b68dd02861e))
* add proxy debug header ([ba03f53](https://github.com/ferdifir/kapster/commit/ba03f531415827fe82ccc6dd40c5b790bebd37d5))
* add security headers via next.config for static pages ([01c1ba0](https://github.com/ferdifir/kapster/commit/01c1ba09701d3e623fac195657f4972cd849a768))
* add solid background to navbar and hero section for mobile visibility ([7bef088](https://github.com/ferdifir/kapster/commit/7bef088d22408eac31bb174fe2961f7b56fd3895))
* add tile.openstreetmap.org to connect-src in CSP ([f8b79aa](https://github.com/ferdifir/kapster/commit/f8b79aa282e18572475527d102dab1710b7a4e83))
* add timestamp to logo/cover filenames to bust browser cache ([5fade09](https://github.com/ferdifir/kapster/commit/5fade0961acc4ad2a182063340085265fbc6b6e2))
* add type param to revalidatePath for dynamic routes ([bcadaa0](https://github.com/ferdifir/kapster/commit/bcadaa01adaf1084394a0588fc93a97845157852))
* add upper bound date validation in dashboard queue page ([ada8ee2](https://github.com/ferdifir/kapster/commit/ada8ee2322e9365890e33f1392a5ea6e22fa6813))
* add XSS escaping, loading/error UI, DOM-based marker hover, merged click handler in MapView ([040c28e](https://github.com/ferdifir/kapster/commit/040c28e4268d50353b5ec5243e351cab11835a10))
* apply security headers to redirect responses ([6b112ca](https://github.com/ferdifir/kapster/commit/6b112ca4e8c23bbc01827e082cc68a2fee40a5db))
* **auth:** handle duplicate unconfirmed signup + add resend email ([26ade1f](https://github.com/ferdifir/kapster/commit/26ade1f3c8b7b410282f98b86902ecac3a72296d))
* **auth:** support both confirmed and no-confirmation signup flow ([26e901d](https://github.com/ferdifir/kapster/commit/26e901d496cfdee5760ed9f2786ca00318120cef))
* **auth:** use NEXT_PUBLIC_BASE_URL for email redirect ([33bcb47](https://github.com/ferdifir/kapster/commit/33bcb477e373d89808992a8e0d232aac31c9f355))
* **auth:** use NEXT_PUBLIC_BASE_URL in callback redirect ([dce46b4](https://github.com/ferdifir/kapster/commit/dce46b458f291194a33504fadf5c40dfd4c2e466))
* **barbers:** use NEXT_PUBLIC_BASE_URL for invite link generation ([6ece32d](https://github.com/ferdifir/kapster/commit/6ece32dfb9c2bf4b32e44d7b79d965f7463a65ef))
* capture container ref before await, add isInitializedRef guard to prevent double marker add in MapView ([f602ac0](https://github.com/ferdifir/kapster/commit/f602ac061019ad3e1e51c579bf22c79174bc5504))
* correct FAQ trial answer - no free trial ([148b0a7](https://github.com/ferdifir/kapster/commit/148b0a74dcea9e81ec8b306b5e5e1f8af3bc20ba))
* extract date picker to client component, clean up redundant code ([04a9fc6](https://github.com/ferdifir/kapster/commit/04a9fc66c9dff9e0dcf249e0f6180c3c3dce6c8b))
* handle error saat insert services default ([49ca48d](https://github.com/ferdifir/kapster/commit/49ca48df76181cbe5f6997f2ebbc464746d425b0))
* handle phone_unverified query param + session check ([e3d1724](https://github.com/ferdifir/kapster/commit/e3d1724e2a999196c8c429e0e54f33ec5bc94767))
* improve mobile responsiveness for navbar and hero section ([4dc31ba](https://github.com/ferdifir/kapster/commit/4dc31bac15c8bfd47b411c22f6bc6f9f052cf819))
* improve WhatsApp connect error handling and validation ([f408e04](https://github.com/ferdifir/kapster/commit/f408e0463a0acc848a017db22aadc7927ec0f737))
* increase top padding on map page to clear navbar ([0ca6ac9](https://github.com/ferdifir/kapster/commit/0ca6ac9ac47268a62be213feb0991d7803fe7962))
* navbar - ubah Lihat Harga jadi Masuk, hapus Masuk lama ([9992191](https://github.com/ferdifir/kapster/commit/9992191753041196ae1d6d7cc437ca5cf1d83a49))
* normalize phone number and add [@c](https://github.com/c).us suffix for WuzAPI ([3278b38](https://github.com/ferdifir/kapster/commit/3278b38344f6f7eb7fd806abcc257a6f0c301584))
* normalizePhone now handles numbers starting with 8 (without 0 prefix) ([fcd8872](https://github.com/ferdifir/kapster/commit/fcd88721da804e67aa880c81dc5d19d063fb7495))
* optional chaining for tab.count type error ([c3fb888](https://github.com/ferdifir/kapster/commit/c3fb888e46decc5f4bfcc5809857f7dfade7aef7))
* phone verification edge cases, OTP resend cooldown timer, increase wuzapi timeout, fix middleware redirect loop ([d86ac5e](https://github.com/ferdifir/kapster/commit/d86ac5e0128fafe0f82c5f41e1dcb0ea8818cf35))
* prevent duplicate addMarkers on first render via barbershop ID comparison in MapView ([88d3fda](https://github.com/ferdifir/kapster/commit/88d3fda264142e8b75831025dd7ab77232249a6c))
* properly handle sendTextMessage result instead of swallowing errors ([f923e27](https://github.com/ferdifir/kapster/commit/f923e275f6d10a6ab53a4214ae70d1ad94169372))
* proxy uploads through API route with admin client to bypass RLS ([8671a64](https://github.com/ferdifir/kapster/commit/8671a64570c135812012465640e5a48f0e0cafab))
* read booking_max_days from settings in joinQueue, add server-side range validation ([54759e6](https://github.com/ferdifir/kapster/commit/54759e61be0a9da676ce6308b3aaed157e372427))
* redirect ke OTP kalau user belum verify WA ([9409827](https://github.com/ferdifir/kapster/commit/9409827168607976bd96c1641758dcb5346999bf))
* remove [@c](https://github.com/c).us suffix from WuzAPI sendTextMessage ([806698f](https://github.com/ferdifir/kapster/commit/806698ff73d794b78aaf6c83abb49b97780ad71c))
* remove dead config, add fallbacks, extract price constant ([e138104](https://github.com/ferdifir/kapster/commit/e13810454bcdc2fc4be6f0fdee7be774cccc2ae8))
* remove extra closing brace in connectSession function ([c2001e4](https://github.com/ferdifir/kapster/commit/c2001e477713b6e13e8832a4f23eab547aa89c8d))
* remove phone input from onboarding step 2 ([ae3308a](https://github.com/ferdifir/kapster/commit/ae3308a2657eafa5f52c05b150675ebcb7df2017))
* remove phone_verified_at check blocking password reset OTP send ([5770536](https://github.com/ferdifir/kapster/commit/577053607e09dee883bb7665875acd10b27ec9dc))
* remove profiles check from sendOTP, use OTP profile_id in resetPassword ([6ce235b](https://github.com/ferdifir/kapster/commit/6ce235bcf1de6becb6ee065d012ade58548e65de))
* remove trial-related text, reflect 100% free SaaS messaging ([381810f](https://github.com/ferdifir/kapster/commit/381810f836011f6ecf0eb91be69e5d03aac9500b))
* rename middleware.ts -> proxy.ts (Next.js 16 breaking change) ([b4a9006](https://github.com/ferdifir/kapster/commit/b4a900615cb4e0c4805ed272d2b10184ddcb11f6))
* reorder payment update before subscription upsert for idempotency ([8146da8](https://github.com/ferdifir/kapster/commit/8146da8841ed283159dcf8c3c102769bd4edb54b))
* replace 'gacor' in HeroSection and CTASection ([cdde72e](https://github.com/ferdifir/kapster/commit/cdde72ec8902038ce82f5c2d4d9ea24cebb92af8))
* replace window.location.origin with NEXT_PUBLIC_BASE_URL in BarbersManager ([347459a](https://github.com/ferdifir/kapster/commit/347459a94a1b4ec432ea1af1784a870982f3be3d))
* responsive HeroSection for small screens (iPhone SE etc) ([32fb71a](https://github.com/ferdifir/kapster/commit/32fb71abf5889f698d876af2c5a5917a7a06a7c8))
* restore profiles existence check for password_reset OTP (remove phone_verified_at requirement, keep auth gate) ([ee3e925](https://github.com/ferdifir/kapster/commit/ee3e9259c4b1b5effa24a65a662c23771aee55a1))
* rewrite map components to use maplibre-gl instead of non-existent MapCN.dev CDN ([3ebd1f5](https://github.com/ferdifir/kapster/commit/3ebd1f5f7b2016a24878d1f16b75693207670d45))
* safety net cek WA verify di submit onboarding ([ead2f7d](https://github.com/ferdifir/kapster/commit/ead2f7d7308110b91b222ac3dc98f754ea38814b))
* **seo:** deduplicate barbershop query using React cache ([05fc40c](https://github.com/ferdifir/kapster/commit/05fc40cfe02e02770ff086a324637adc9072fb69))
* separate realtime channel setup from fetchData in status page ([c3a0a06](https://github.com/ferdifir/kapster/commit/c3a0a06ab8a5e4822473354a0283364f52977319))
* sync pricing in JSON-LD, show location name on map picker, improve billing error ([11ae5d8](https://github.com/ferdifir/kapster/commit/11ae5d8a9f1f1fe2f64542003cdbabbfd4f26f45))
* tetap ke halaman OTP walau kirim OTP gagal ([80203e8](https://github.com/ferdifir/kapster/commit/80203e8e31709cf202087ce73585cf58017dca80))
* type error profile.phone string | null ([80c93ab](https://github.com/ferdifir/kapster/commit/80c93ab34920ec0775fd9e97955f71ae17a45b21))
* update CSP in middleware (was overriding config headers) ([43a6fa0](https://github.com/ferdifir/kapster/commit/43a6fa0615d2e9896364d79b6f7b491db4b9064e))
* update plan types to support basic plan and remove enterprise ([6fde962](https://github.com/ferdifir/kapster/commit/6fde962ae469176854b0b161fec6bc0301e11197))
* update twitter description and add crossOrigin to fonts preconnect ([c260b1d](https://github.com/ferdifir/kapster/commit/c260b1dbac025c0d5c55ba20b7543c3ab3f0ad8c))
* use correct lucide-react icon exports ([84e4c8b](https://github.com/ferdifir/kapster/commit/84e4c8bd53885f56aaf3d5d2a3ecd5db045bc574))
* use landing page logo as favicon ([8cdaa9f](https://github.com/ferdifir/kapster/commit/8cdaa9f9b5eb6f4629d8ba5cfbb4a57a65aec31e))
* use ref instead of querySelector for file inputs (upload cover triggered logo) ([d1b360f](https://github.com/ferdifir/kapster/commit/d1b360fc701cbecda7d1cf66a300ad1dcaa2a946))
* wire up landing page CTA buttons to register/login/WA ([d215351](https://github.com/ferdifir/kapster/commit/d2153518d0635da66337a838cdaf0ece79ec9b03))
* wrap useSearchParams in Suspense boundary for forgot password pages ([3c728a8](https://github.com/ferdifir/kapster/commit/3c728a8c5e1f9210de7ac6459d1498f4e3787a40))
* wrap useSearchParams in Suspense on login page ([8a47eed](https://github.com/ferdifir/kapster/commit/8a47eeddc31d1966de86a453129bdec90ee0e74d))


### Features

* add about page for E-E-A-T compliance ([95eced8](https://github.com/ferdifir/kapster/commit/95eced8e0b80718c9b68fa5a0c905675b36862f9))
* add barbershop logo upload and display on public pages ([f5a9f84](https://github.com/ferdifir/kapster/commit/f5a9f846f03b49d88b73f00d2ef349096d024eca))
* add billing page for subscription payment and status ([1c2e965](https://github.com/ferdifir/kapster/commit/1c2e9652d8334f4a4db3359a633ca30f0484fda7))
* add booking_max_days setting to dashboard ([b8d7e96](https://github.com/ferdifir/kapster/commit/b8d7e961f2340eb590c74f4e80148193c73dba0c))
* add cancel subscription option to dashboard ([1a513c7](https://github.com/ferdifir/kapster/commit/1a513c71214ff37867679ba0f1c3eaa27981a674))
* add date navigation and pre-booking badge to dashboard queue ([8e7a30f](https://github.com/ferdifir/kapster/commit/8e7a30f3ed31571033243ecfc7de77368c6b4fb1))
* add date parameter and validation to joinQueue, fix is_open security gap ([d61c54c](https://github.com/ferdifir/kapster/commit/d61c54cc330c542d8a5dbd05822270c372816c65))
* add date picker to public queue page, always show form ([d4a9e4e](https://github.com/ferdifir/kapster/commit/d4a9e4e233b4740b37f269efa4547af684013a3b))
* add fallback UI for sparse barbershop profile data ([da66c1f](https://github.com/ferdifir/kapster/commit/da66c1f609f4534a6b54374aa9bdfa2ba3c83f9a))
* add FAQ section to landing page ([10172f1](https://github.com/ferdifir/kapster/commit/10172f1a37484776d65b094ffc03f5d9ff2558ab))
* add feedback page route and sidebar navigation ([775cd38](https://github.com/ferdifir/kapster/commit/775cd3854d8d0226071c045a845bb167f7a5ee61))
* add feedback server actions ([e58b1ae](https://github.com/ferdifir/kapster/commit/e58b1ae419a6a5fff96a2009b46fc834b87285f7))
* add feedback table and storage bucket ([efb05bf](https://github.com/ferdifir/kapster/commit/efb05bf387eb744377a89f549764c01e8130e85b))
* add Feedback type to Database types ([4d6b6de](https://github.com/ferdifir/kapster/commit/4d6b6de6df60aeed18ca276b18105770605b1bdb))
* add FeedbackForm, FeedbackInbox, FeedbackTabs components ([0a79c88](https://github.com/ferdifir/kapster/commit/0a79c88f08943326cbbdde4c01a266e9715b6f2c))
* add forgot password link to login page ([7e5dc8c](https://github.com/ferdifir/kapster/commit/7e5dc8c9e794cabb9459fa8d27a0f43a9ebd80b6))
* add forgot password OTP verification page ([a2921df](https://github.com/ferdifir/kapster/commit/a2921df3a30c675ecb9b10a9ff9c9fa6c0bed299))
* add forgot password page (phone input) ([c085af9](https://github.com/ferdifir/kapster/commit/c085af992ac1f05612fb9b90bd87bf9a3bafacdb))
* add gallery-images storage bucket with RLS policies ([acf2278](https://github.com/ferdifir/kapster/commit/acf2278cbf5f0d878980c52417201373b7218f0a))
* add Google Analytics GA4, remove placeholder verification, update sitemap ([c01d584](https://github.com/ferdifir/kapster/commit/c01d5844c3d79bc1001dab73e42e2722cf1fdd78))
* add lat/lng columns to barbershops table ([502a115](https://github.com/ferdifir/kapster/commit/502a115873f8122bace68b00a795531436f79763))
* add legal pages and wire up all legal links ([5a7282d](https://github.com/ferdifir/kapster/commit/5a7282d58031e3891279fcb89714a1431ef31a3f))
* add MapPicker integration to dashboard settings ([abdecae](https://github.com/ferdifir/kapster/commit/abdecaee1305ec27e2a6e1c486d70f2606691de8))
* add MapView component with shared MapCN types ([886cd20](https://github.com/ferdifir/kapster/commit/886cd20dfec53c176a0fbdfd07054e5ab68d6384))
* add OTP and password reset server actions ([bbafb3f](https://github.com/ferdifir/kapster/commit/bbafb3fe66c2888a65aaaa4ccf59c060d719d725))
* add OTP generation and hashing utility ([211180d](https://github.com/ferdifir/kapster/commit/211180d2190961bd0da3135b82a45e0b0a81c9be))
* add OTP WhatsApp templates ([66d63ec](https://github.com/ferdifir/kapster/commit/66d63ec48928ba858d73aca3c7d5ea787e9f80f5))
* add Pakasir client utility for payment URL generation ([c7d381f](https://github.com/ferdifir/kapster/commit/c7d381fc1d94387b6eb5282ea62a8b0e65395953))
* add Pakasir webhook endpoint for payment confirmation ([d138112](https://github.com/ferdifir/kapster/commit/d1381122c03c89137b2f64cd7ea772727b1f5fe7))
* add password reset page ([cf2722f](https://github.com/ferdifir/kapster/commit/cf2722ffd89f3395868d1c188110f01412d03d7a))
* add Peta link to Navbar (desktop and mobile) ([2ff3752](https://github.com/ferdifir/kapster/commit/2ff3752a720a18e3fde0b11f20028b5cc44a0c81))
* add pg_cron jobs for WA send and reminder ([2e91287](https://github.com/ferdifir/kapster/commit/2e9128783a371aa16f8dc63d07085dfb71c1ce47))
* add phone field and WhatsApp OTP verification to registration ([f329710](https://github.com/ferdifir/kapster/commit/f3297104d9f115132e3aa1fe9a12639d83e9674c))
* add phone_otp_codes and phone_verified_at types ([89c5d3f](https://github.com/ferdifir/kapster/commit/89c5d3fed22fdcd9233f0999e3f38dd412ce5ae6))
* add phone_otp_codes table and phone_verified_at column ([d831300](https://github.com/ferdifir/kapster/commit/d831300bfc6d4d6f5f8538d7bea10ee10d92d17a))
* add public map page to display active barbershops ([c9f351d](https://github.com/ferdifir/kapster/commit/c9f351d1b931d5bca44a69e80f852efb5c8ecd26))
* add RLS policies for subscriptions and payments tables ([775889c](https://github.com/ferdifir/kapster/commit/775889c58ba9f6c140a0098125d49373724e7953))
* add subscription check to proxy route protection ([210c5c6](https://github.com/ferdifir/kapster/commit/210c5c68ed6d6bf2457070000d7a3688151b3be5))
* add subscription check utility ([e66e59b](https://github.com/ferdifir/kapster/commit/e66e59b5b91b23f086008d7813b534565537284f))
* add subscriptions and payments tables with types ([a8c088d](https://github.com/ferdifir/kapster/commit/a8c088dabcd2f64ea22dedd91018afa613917632))
* add Telegram notification helper ([844e990](https://github.com/ferdifir/kapster/commit/844e990f28e88410132090c8c6905745599817a3))
* add WA queue notification helper and types ([532fe1a](https://github.com/ferdifir/kapster/commit/532fe1a7a3b1ed004fa2c7d8ca5d4ab5cd671221))
* add wa_notifications table and barbershops WA columns ([7ad64ec](https://github.com/ferdifir/kapster/commit/7ad64ec36313ca33d11edbbd1c139e2a7620dc2e))
* add wa_notifications table and barbershops WhatsApp columns ([965286b](https://github.com/ferdifir/kapster/commit/965286bdecd849e86e6e250d062f35f7a0a497a1))
* add wa-sender edge function for WhatsApp notification queue processing ([cd73371](https://github.com/ferdifir/kapster/commit/cd73371b5e99af9b3e51ca0141c044186fea19ec))
* add WhatsApp connection server actions ([158f193](https://github.com/ferdifir/kapster/commit/158f193093d7fd091715eaeea924b32e7d636edf))
* add WhatsApp invite button for barber management ([6bc5995](https://github.com/ferdifir/kapster/commit/6bc59957c892f0e7d559bdbd35c810ed2a4dcafb))
* add WhatsApp notification template renderer ([a9b9f70](https://github.com/ferdifir/kapster/commit/a9b9f708d41a81207bd382a6ae293bbc9b95469e))
* add WuzAPI admin client library ([20aeab0](https://github.com/ferdifir/kapster/commit/20aeab0af1488937eb3ab2c104c23b1dfaafebe7))
* centralized error logging to Telegram for all system failures ([e6fa5d7](https://github.com/ferdifir/kapster/commit/e6fa5d7079eb7bdfeb7ab6fcaefbc7fbcd33f9b7))
* custom datepicker matching barbershop dark theme ([82c422e](https://github.com/ferdifir/kapster/commit/82c422efa72c00d7e8bfb0824378a2eb516280c0))
* implement barbershop profile page with hero, about, gallery, and services carousel ([d095f13](https://github.com/ferdifir/kapster/commit/d095f13882d32856ddbc836f7ca79e72912c4d4c))
* implement QueueBarber SaaS phases 1-4 ([b4e265e](https://github.com/ferdifir/kapster/commit/b4e265ea7907fbfcfeaa451909ef3a2d71f27710))
* make skip non-terminal — skipped customers can be called again ([52466a4](https://github.com/ferdifir/kapster/commit/52466a4058309d04995befc87b7ddfabbda017a2))
* normalize phone numbers before sending to WuzAPI ([e83dc99](https://github.com/ferdifir/kapster/commit/e83dc9987eeab2b62078af3b5329b2859d8b9620))
* **seo:** add dynamic metadata to queue page with cached query ([8b3081c](https://github.com/ferdifir/kapster/commit/8b3081c8d6072c22add298f6c68a0f2b25ead71a))
* **seo:** add FAQ+HowTo JSON-LD, remove aggregateRating, add preconnect ([63c982c](https://github.com/ferdifir/kapster/commit/63c982c0a1847bd84a957cc3e965e9ac012c880a))
* **seo:** add LocalBusiness JSON-LD to barbershop pages ([6fbb6c6](https://github.com/ferdifir/kapster/commit/6fbb6c6733d4446f728cff9b78d216aee3344c03))
* **seo:** add noindex to display page ([406c988](https://github.com/ferdifir/kapster/commit/406c988a8e1e4cdc0d3a8437f8d5ee65a8301182))
* **seo:** dynamic sitemap with barbershop pages and daily revalidation ([49318b2](https://github.com/ferdifir/kapster/commit/49318b224447b7d2cf9b538ccc864dffc6e4204b))
* show future queue date and status on status page ([354bf55](https://github.com/ferdifir/kapster/commit/354bf55d009e149397e9b84df709da9cd05a1371))
* Telegram notifications for new registration and subscription ([5ec12a2](https://github.com/ferdifir/kapster/commit/5ec12a25a990f31f01fcbb8a42574483c032b03e))
* update CTA subtitle with SEO-friendly keywords ([b4a873a](https://github.com/ferdifir/kapster/commit/b4a873a12a4b97eb2415e0a31cf565878d8f9bc4))
* update feature icons to match each card's context ([8e7c59d](https://github.com/ferdifir/kapster/commit/8e7c59df43cb2929d9212b0cc6b5a40ce3e9e715))
* update homepage content and terms of service ([1ac6c51](https://github.com/ferdifir/kapster/commit/1ac6c519f215260ae825db528356a37ee820a316))
* update JSON-LD and metadata for paid pricing model ([736717a](https://github.com/ferdifir/kapster/commit/736717a69d4dbc9629a47ebdb75d742943fc073e))
* update pricing section from free to Rp10.000/month ([f8436de](https://github.com/ferdifir/kapster/commit/f8436de55e0fa6982e2238192d815da7e109cefe))
* whatsapp fallback via system number + sent_via_kapster footer ([13ef7e5](https://github.com/ferdifir/kapster/commit/13ef7e5cae533ee8d2eccb32a0458257330ca3b6))
* wire WA notification into createBooking action ([b4122fd](https://github.com/ferdifir/kapster/commit/b4122fd18217b2a81ba44d9b90d6a14fb879793d))
* wire WA notifications into queue/booking actions and add settings UI ([61a1a4c](https://github.com/ferdifir/kapster/commit/61a1a4cee3bb2e96e99bb156db76722a65266a92))


### Performance Improvements

* add content-visibility to below-fold homepage sections ([f7bdc88](https://github.com/ferdifir/kapster/commit/f7bdc88d389f5e80d6a6f1996e4b4d246f36fc90))
* replace img with next/image for barbershop logos ([3522d80](https://github.com/ferdifir/kapster/commit/3522d8016a0a2b8b42a828ad9ac1099612722120))
