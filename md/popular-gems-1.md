At [RubyElders.com](https://rubyelders.com), we recently worked on improving the long-term health of popular Ruby gems that are heavily used but might not have active maintainers. Our main goal was to check if these gems still work on current Ruby versions and, if not, fix that.

We built a small system that compares public download data from RubyGems.org to detect the fastest-growing gems month-to-month. We then filtered out official gems from AWS, Google, Rails, and Bundler to focus on smaller community projects.

For each gem, we checked GitHub activity (issues, commits) and whether it had continuous integration (CI) set up. Using a local LLM (Llama 3.1 via Ollama), we also analyzed the CI configs to figure out which Ruby versions were being tested—if any.

From the top 200 gems, we found **7 widely-used gems (4M+ downloads/month each) that had no CI at all.** We reviewed each one and submitted PRs to improve the situation. Here's what we found and what we did.

## rb-fsevent

This gem is a dependency of `listen`, which powers `guard`—a tool that was widely used for test-driven development around 2020. Even today, `listen` reaches almost 3 million downloads each month.

Although `rb-fsevent` is macOS-only, we were able to add CI using GitHub Actions without owning a Mac.
→ [CI PR](https://github.com/guard/rb-fsevent/pull/96)

**Maintenance type:** Feature-complete. Needs updates only when a new version of macOS, Xcode, or Ruby is released.

---

## `uber` and `declarative`

These two gems are dependencies of `addressable`, which is itself used by `google-apis-core`—a library downloaded about 6 million times each month.

For both gems, we added CI and modernized test setups to work with recent Ruby versions.
→ [`uber` CI PR](https://github.com/apotonick/uber/pull/25)
→ [`declarative` CI PR](https://github.com/apotonick/declarative/pull/10)

**Maintenance type:** Low activity, stable codebases written in plain Ruby. Should be checked when a new major Ruby version is released, but otherwise rarely need changes.

---

## `rest-client`

With around 6 million downloads per month, `rest-client` is still widely used despite being outdated. It’s also a dependency of many other gems like:

* `oauth` (\~2.2M downloads/month)
* `kubeclient` (\~1M/month), now switching to Faraday ([PR](https://github.com/ManageIQ/kubeclient/pull/466))
* `gitlab-labkit`, `discordrb-webhooks`, and `aliyun-sdk` (each \~1M/month)

We contacted the maintainer, who confirmed there are no plans to maintain the gem further. They recommended archiving it in favor of actively developed alternatives like `faraday`.

**Next steps:** A final release and a migration guide to Faraday would help. PRs could be opened on top dependent gems to spread awareness and support migration.

**Maintenance type:** Deprecated. Should be archived with migration advice. Future efforts should go into helping users switch away.

---

## `simplecov_json_formatter`

This tiny gem (\~3 files, <100 lines) generates JSON output for SimpleCov. The CI (on CircleCI) was broken, so we moved it to GitHub Actions.
→ [CI migration PR](https://github.com/codeclimate-community/simplecov_json_formatter)

But then we realized something important: this gem is already a dependency of SimpleCov and doesn’t really stand alone—it just assumes SimpleCov is loaded.

So we proposed merging it back into the main SimpleCov project:
→ [Merge PR](https://github.com/simplecov-ruby/simplecov/pull/1130)
→ [CI fix PR](https://github.com/simplecov-ruby/simplecov/pull/1131)

**Maintenance type:** Doesn't need to exist separately. Should be merged back and removed as an independent gem.

---

## `os`

This gem provides platform detection across Windows, Linux, and macOS. It has around 6.5 million downloads per month and is a dependency of `googleauth`.

We added GitHub Actions CI and made a few quality-of-life improvements.
→ [CI + improvements PR](https://github.com/rdp/os/pull/83)

**Maintenance type:** Needs occasional review with major OS or Ruby version changes.

---

## `xpath`

`xpath` is a low-level gem used by `capybara`, which is the core tool for web testing in Ruby and Rails projects. It has about 5 million downloads per month.

We added CI via GitHub Actions after getting access to the repo.
→ [CI PR](https://github.com/teamcapybara/xpath/pull/104)

During this work, we noticed that Capybara itself might not currently have active maintainers—we’ll share more on that soon.

**Maintenance type:** Feature-complete. Should be checked when there are updates to Nokogiri or Ruby, but otherwise requires minimal work.

---

## Conclusion

Every gem is different. Some just need a check-up now and then, while others (like `rest-client`) need clear plans for deprecation. But the shared good practice is simple: **having CI that runs on all supported Ruby versions**.

That’s how we can keep the Ruby ecosystem strong—even when maintainers move on.

If you’d like to get involved or follow our work, visit [RubyElders.com](https://rubyelders.com). We’re here to help make community gems more reliable for everyone.

---

Let me know if you'd like a Czech translation or a shorter version for newsletters/social media!

