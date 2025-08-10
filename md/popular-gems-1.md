*Note: This post looks back at work we did in March 2025. Some things have changed since then — we’ll mention those in the update notes.*

---

At [RubyElders.com](https://rubyelders.com), we’ve been working on keeping the Ruby ecosystem healthy—especially for popular gems that millions of people use but that might not have active maintainers anymore. Our mission for this project was simple: **make sure these gems still work on today’s Ruby versions, and fix them if they don’t**.

To do this, we built an automated system that compares monthly RubyGems.org download data to spot the fastest-growing gems. We then filtered out the “big players” from AWS, Google, Rails, and Bundler, so we could focus on smaller, community-driven projects.

One of the fun parts? We made a **small AI-powered tool that runs entirely on our own machines**. It scans GitHub Actions workflow files (YAML) for each gem, extracts details about what’s being tested, and flags potential maintenance gaps—like missing CI or not testing on current Ruby versions. This meant we could quickly spot repositories that might be in trouble, without relying on guesswork.

From the top 200 gems, the AI+automation combo revealed something surprising: **7 hugely popular gems (4M+ downloads/month each) had no CI at all**.

*You can explore the full and raw output of this automation in [Google Sheet](https://docs.google.com/spreadsheets/d/1ElW-oXbkGHxUHqpi-_MrFvX_nt8OUPdUmN1ixBy_o_k/edit?usp=sharing).*

An important side benefit of this work is that it shows how **each codebase is different**. Even though all 7 gems had missing CI, the type of maintenance they actually need varies a lot. That’s why usual oversimplified “health metrics” like *last commit date* or *latest release date* can be misleading—they don’t tell the full story of what care a project really needs.

Here’s the story of what we found and how we helped.

---

## [`rb-fsevent`](https://rubygems.org/gems/rb-fsevent)


### Summary

[`rb-fsevent`](https://rubygems.org/gems/rb-fsevent) is a small but important macOS-only gem used to detect file changes. It’s a dependency of [`listen`](https://rubygems.org/gems/listen), which in turn powers [`guard`](https://rubygems.org/gems/guard)—a tool that was a leader in test-driven development workflows around 2020. Even today, [`listen`](https://rubygems.org/gems/listen) is downloaded almost **3 million times each month**, so keeping this gem healthy benefits a lot of developers, even if they don’t use it directly.

### Work done

Despite being macOS-specific, we were able to debug and set up CI for it entirely through GitHub Actions, without having a Mac at hand. We submitted a pull request to add the missing CI, and it was accepted and merged the very next day—a rare “happy path” contribution where everything went smoothly.

- [Adding CI pull request](https://github.com/guard/rb-fsevent/pull/96)

### Maintenance needs note

This is a **feature-complete gem**. It generally only needs updates when Apple releases a new version of macOS or Xcode, or when a new major Ruby version comes out. In between, it can run for long stretches without requiring changes.

---

## [`uber`](https://rubygems.org/gems/uber) and [`declarative`](https://rubygems.org/gems/declarative)

### Summary

[`uber`](https://rubygems.org/gems/uber) and [`declarative`](https://rubygems.org/gems/declarative) are small Ruby gems that work together as dependencies of [`representable`](https://rubygems.org/gems/representable), which is in turn used by [`google-apis-core`](https://rubygems.org/google-apis-core)—a library downloaded around **6 million times each month**. While these two gems aren’t often used directly today, they still play a role deep in a lot of dependency chains.

### Work done

Both gems were still using Travis CI, which no longer works, so we replaced it entirely with GitHub Actions. While doing that, we also ensured tests ran on modern Ruby versions by porting them to newer libraries and fixing compatibility issues.

During this process, we had the chance to connect with <img src="https://avatars.githubusercontent.com/u/10406?v=4" class="avatar"> [Nick Sutterer (@apotonick)](http://github.com/apotonick), the original author of these gems. At first, he was skeptical about whether it even made sense to update them—but the discussion quickly became a friendly and interesting exchange. That conversation led us into exploring his [Trailblazer project](https://trailblazer.to/2.1), which is well worth checking out if you’re interested in higher-level architecture for Ruby applications.

As a side note, [`representable`](https://rubygems.org/gems/representable) (which depends on both gems) turned out to be an interesting project in its own right—there’s nothing quite like it in Ruby, and it gave us some [Rust Serde](https://serde.rs/) vibes. This is one of the fun parts of this work: exploring other projects and discovering those unknown or forgotten “gems” (pun intended) hidden in the dependency tree.

- [Replacing CI with GitHub Actions `uber` PR](https://github.com/apotonick/uber/pull/25)
- [Replacing CI with GitHub Actions `declarative` PR](https://github.com/apotonick/declarative/pull/10)

### Maintenance needs note

These are **low-activity, stable codebases written in plain Ruby**. They don’t need frequent updates—just a quick check when a new major Ruby version is released.

---

## [`rest-client`](https://rubygems.org/gems/rest-client)

### Summary

[`rest-client`](https://rubygems.org/gems/rest-client) was one of the best-known Ruby HTTP clients, downloaded around **6 million times each month**. It’s used both directly by developers and indirectly through many other gems, including:

* [`oauth`](https://rubygems.org/gems/oauth) (~2.2M downloads per month, **dev dependency only**)
* [`gitlab-labkit`](https://rubygems.org/gems/gitlab-labkit) (~1M downloads per month, **dev dependency only**)
* [`kubeclient`](https://rubygems.org/gems/kubeclient) (~1M downloads per month, replaced by Faraday in version 5 — [PR](https://github.com/ManageIQ/kubeclient/pull/466) merged, but release not yet made)
* [`discordrb-webhooks`](https://rubygems.org/gems/discordrb-webhooks) (~1M downloads per month, **runtime dependency**)
* [`aliyun-sdk`](https://rubygems.org/gems/aliyun-sdk) (~1M downloads per month, **runtime dependency**)

Many top dependents have already found ways to remove [`rest-client`](https://rubygems.org/gems/rest-client) or restrict it to non-production paths. But for runtime dependencies like [`discordrb-webhooks`](https://rubygems.org/gems/discordrb-webhooks) and [`aliyun-sdk`](https://rubygems.org/gems/aliyun-sdk), migrating to Faraday (or similar) is still needed.

### Work done

We reached out to the maintainers and managed to get in touch with one of them. They confirmed there are **no plans to maintain the gem** and supported the idea of a final release followed by archiving. They also agreed it would be helpful to provide a migration guide to Faraday.

We created that migration guide and contributed it directly to Faraday’s documentation, then reviewed the most-downloaded dependent gems to see how they were handling the transition. Where possible, we explored contributing migrations ourselves — for example, replacing it in [`discordrb-webhooks`](https://rubygems.org/gems/discordrb-webhooks) looks entirely doable.

To keep [`rest-client`](https://rubygems.org/gems/rest-client) functional until the deprecation is finalized, we fixed failing specs, cleaned up Gemfile issues, and added a minimal CI setup.

- [Migration guide in Faraday docs PR](https://github.com/lostisland/faraday/pull/1625)
  - ([published here](https://lostisland.github.io/faraday/#/getting-started/rest-client-migration))
- [Final CI and fixes for rest-client PR](https://github.com/rest-client/rest-client/pull/831) *(pending)*

Unfortunately, after the initial conversation, we haven’t received any follow-up from the maintainers — so the final release and archiving are still pending. We hope to reconnect soon to finish the process.

### Maintenance needs note

This gem is effectively **deprecated**. The safest path forward is to archive it and direct users to [`Faraday`](https://rubygems.org/gems/faraday) (with the migration guide provided). Until then, only security fixes and migration support for dependent projects should be considered.

---

## [`simplecov_json_formatter`](https://rubygems.org/gems/simplecov_json_formatter)

### Summary

[`simplecov_json_formatter`](https://rubygems.org/gems/simplecov_json_formatter) is a very small gem—only about 3 files and under 100 lines of code—whose sole purpose is to generate JSON output for [`SimpleCov`](https://github.com/simplecov-ruby/simplecov) — library behind most of the code coverage metrics in whole Ruby ecosystem. It’s already listed as a dependency of SimpleCov, so it is not really stand alone since it assumes [`SimpleCov`](https://github.com/simplecov-ruby/simplecov) is loaded before it can do anything.

### Work done

The gem had CI configured on CircleCI, but it was broken. We replaced it with GitHub Actions to get the tests running again.

While doing that, we realized this gem was a perfect candidate to merge back into the main [`SimpleCov`](https://github.com/simplecov-ruby/simplecov) repository. It’s tiny, single-purpose, and already tied to SimpleCov’s lifecycle. So we proposed merging it back and cleaning up the duplication.

Before we could do that, we had to fix the CI in the [`SimpleCov`](https://github.com/simplecov-ruby/simplecov) repo as well. The fix was merged, but the merge-back PR is still waiting for review. We’ve been trying to get attention from other maintainers, so far without success.

- [Fix CI in `SimpleCov`](https://github.com/simplecov-ruby/simplecov/pull/1131)
- [Replace CircleCI with GitHub Actions in `simplecov_json_formatter`](https://github.com/codeclimate-community/simplecov_json_formatter) *(pending)*
- [Propose merge of json formatter into `SimpleCov`](https://github.com/simplecov-ruby/simplecov/pull/1130) *(pending)*

### Maintenance needs note

This gem doesn’t need to exist separately. It should be merged back into [`SimpleCov`](https://github.com/simplecov-ruby/simplecov) and retired as an independent gem. Until that happens, any maintenance is minimal and tied directly to SimpleCov’s own release cycle.

---

## [`os`](https://rubygems.org/gems/os)

### Summary

The [`os`](https://rubygems.org/gems/os) gem provides cross-platform detection for Windows, Linux, and macOS. It’s downloaded around **6.5 million times each month** and is a dependency of [`googleauth`](https://rubygems.org/gems/googleauth)—meaning it’s pulled into a huge number of Ruby projects indirectly. Because it deals directly with platform-specific details, it needs to be kept in sync with changes in operating systems and Ruby itself.

### Work done

When we first looked at [`os`](https://rubygems.org/gems/os), it had no working CI and a few quirks in its test suite and runtime behavior. What started as a simple plan to “just add GitHub Actions” quickly turned into a series of four pull requests to get everything into shape:

* [Properly parse Windows x64 Ruby](https://github.com/rdp/os/pull/80)
* [Reset OS state for each spec example](https://github.com/rdp/os/pull/81)
* [Accept any amount of CPU cores in tests](https://github.com/rdp/os/pull/82)
* [Add GitHub Actions CI](https://github.com/rdp/os/pull/83)

Along the way, we also got in touch with <img src="https://avatars.githubusercontent.com/u/19505?v=4" class="avatar"> [Peter Boling (@pboling)](https://github.com/pboling), a fellow RubyGems maintainer who has been adopting and maintaining various widely-used gems. If you rely on his work, please check his profile and consider [sponsorship](https://github.com/sponsors/pboling) to support the ongoing maintenance.

### Maintenance needs note

The [`os`](https://rubygems.org/gems/os) gem is stable but needs **occasional reviews**—mainly when new operating system releases introduce changes, or when new Ruby versions are published. With a working CI in place, spotting and fixing these issues should now be much easier with more dynamic setup (like run CI periodically).

---

## [`xpath`](https://rubygems.org/gems/xpath)

### Summary

[`xpath`](https://rubygems.org/gems/xpath) is a low-level gem used by [`Capybara`](https://rubygems.org/gems/capybara), the core library for acceptance and web testing in Ruby and Rails projects. With around **5 million downloads each month**, it plays a key role in automated testing—even though most developers never interact with it directly.

### Work done

We got in touch with original author <img src="https://avatars.githubusercontent.com/u/134?v=4" class="avatar"> [Jonas Nicklas (@jnicklas)](https://github.com/jnicklas) and were granted access to the repository. This allowed us to add a proper GitHub Actions CI setup to ensure compatibility with modern Ruby and [`Nokogiri`](https://rubygems.org/gems/nokogiri) releases.

→ [Modern GitHub Actions pull request](https://github.com/teamcapybara/xpath/pull/104)

While working on [`xpath`](https://rubygems.org/gems/xpath), we discovered something bigger: **Capybara itself currently had no active maintainers**. Given Capybara’s importance—it’s the default acceptance test framework for Rails—this was a significant finding. We started contributing there as well, beginning with [a PR to improve maintenance](https://github.com/teamcapybara/capybara/pull/2811).

*August 2025 update:* Fortunately, one of [`Capybara`](https://rubygems.org/gems/capybara)’s maintainers has since returned, and the project is back in good hands. We plan to keep actively contributing to both [`xpath`](https://rubygems.org/gems/xpath) and [`Capybara`](https://rubygems.org/gems/capybara) to help ensure their stability.

### Maintenance needs note

[`xpath`](https://rubygems.org/gems/xpath) implements a **subset of the [XPath 1.0 specification](https://www.w3.org/TR/1999/REC-xpath-19991116/)** tailored for [Capybara](https://rubygems.org/gems/capybara)’s needs. It is fully complete for this purpose, and there’s no significant usage outside Capybara ([reverse dependencies list](https://rubygems.org/gems/xpath/reverse_dependencies)). Maintenance mainly means staying in sync with [`Nokogiri`](https://rubygems.org/gems/nokogiri) and supported Ruby versions. A durable CI setup—periodically checking against the latest [`Nokogiri`](https://rubygems.org/gems/nokogiri), running `ruby-head` builds, and verifying [Capybara](https://rubygems.org/gems/capybara) integration—would provide early warnings if upstream changes require fixes.

---

## Final notes

### A deep dive into [RubyGems.org](https://rubygems.org/)

This March 2025 update wraps up our first **We ❤️ Ruby** community effort — and it was both fun and fascinating to dig deep into the [RubyGems.org](https://rubygems.org/) ecosystem. This project was possible thanks to the openness and transparency of the [RubyGems.org](https://rubygems.org/) team ([public data](https://rubygems.org/pages/data)) and the availability of the [ClickHouse-powered open dataset](https://clickhouse.com/blog/announcing-ruby-gem-analytics-powered-by-clickhouse), combined with the flexibility of the [GitHub API](https://api.github.com/), which made it easy to script our way through the analysis.

### Every project is different

One thing became very clear: **each gem has different needs**. Some only need an occasional check-up when a new Ruby version is released, some can be merged together to make maintenance easier. And sometimes it’s perfectly fine to say, “this project is done,” as long as we help the community move forward with migration guides and support.

### The one shared rule

Across all cases, we have detected one universal initial good sign of a healthy gem: **stable CI that runs on all currently supported Ruby versions**. Since Ruby gets a new major release roughly once a year (usually around Christmas), with release candidates available weeks or even months in advance, keeping CI up to date is not a huge effort — but it provides enormous value in ensuring projects are ready for the next Ruby release. This should be part of every maintainer’s basic routine.

<ins>First rule of the RubyGems Maintainers Club: **you always keep a stable CI running on all currently supported Rubies**.</ins>

### What’s next

We plan to continue publishing **We ❤️ Ruby** updates more often. Our aim is to keep shining a light on the state of widely-used community gems, highlight where help is needed, and celebrate improvements when they happen.

If you’d like to help keep the Ruby ecosystem healthy, there are a few ways to support this work:

* **Maintainer:** Already maintain open source projects? Fantastic — keep going!
  * **Not a maintainer yet? You can become one!** We’ve sprinkled hints and ideas for improvements throughout this post. Pick one, open a pull request, and see where it takes you. Fair warning: it’s highly addictive.
* **Corporate level:** If your company relies on RubyGems.org infrastructure, consider sponsoring [Ruby Central](https://rubycentral.org/about/) ([corporate sponsorship info](https://rubycentral.org/corporate-sponsorship/)), the non-profit maintaining RubyGems.org, RubyGems, Bundler, and other core projects. We are in close contact with them and fully support their work.
* **Direct support:** You can sponsor RubyElders project directly using [GitHub Sponsors](https://github.com/sponsors/RubyElders).
* **Stay connected:** Follow us for updates on:
  * [Mastodon](https://ruby.social/@rubyelders)
  * [Bluesky](https://rubyelders.bsky.social)
  * [Twitter/X](https://x.com/RubyElders)

We’re already preparing the next **We ❤️ Ruby** community update — stay tuned!
