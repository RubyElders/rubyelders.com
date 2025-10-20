## The Realization

Earlier this year — long before the recent [Ruby Central fiasco](https://gist.github.com/simi/349d881d16d3d86947945615a47c60ca) — I started exploring ideas for the next major version (4.x) of RubyGems and Bundler. That’s when it struck me: somewhere along the way, these projects stopped moving forward. Formats like **gemspec**, **Gemfile**, and others haven’t evolved in years, and any attempt to change them usually ends in early rejection.

Over time, RubyGems and Bundler became finely tuned for **large company deployments** and **super-stable environments**, but that same stability now limits innovation. The excitement of experimenting, hacking, and building new ideas into Ruby’s tooling slowly faded — at least for me.

## The Inspiration

While working on some Python projects recently (mostly [Airflow](https://github.com/apache/airflow)-related), I was deeply inspired by **[uv](https://docs.astral.sh/uv/)** — its simplicity blew me away. The `run` command just *worked*: no confusing errors, no excuses, no manual setup. It installed everything needed — even Python itself — and executed the program at lightning speed.

As a partial web developer, I’ve also long admired how JavaScript projects use the **scripts** section in `package.json`. It’s such a clean way to define project-specific commands — no more copy-pasting long, platform-specific commands from `README`s. In Ruby, I often had to scan CI setups to figure out how to run specs (`rake`, `rspec`, or another runner), how to run linters, and so on.

## The Acceptance

In Ruby, there’s no single entry point for this kind of extra project metadata or developer scripts. Yes, there’s **Rake**, but it suffers from the classic chicken-and-egg problem — it often loads the entire app environment just to run a simple command. It *can* be configured otherwise, but that’s rare in practice. Meanwhile, `Gemfile` is for dependencies, gemspecs aren’t meant for apps, and trying to push features like “install by default” for `bundle exec` inside Bundler felt nearly impossible (even though an environment variable for it already exists).

At the same time, I’ve always admired how well RubyGems and Bundler work internally — they’re elegant, consistent, and incredibly stable. But I realized I wanted to **recompose** them: use the same powerful internals in a different way, with a simpler and more modern interface. Looking deeper inside, I had to accept a truth — changing them directly would be nearly impossible. However, building a **custom “frontend” wrapper** that instructs these tools to behave differently *was* possible.

That’s how the idea for **Ruby Butler** was born. From that point, it began taking shape as a simple command-line tool — the **`rb` command** in your terminal, ready to serve.

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_help.png" 
      alt="Ruby Butler, nice to meet you!" 
    >
  </picture>
  <figcaption>
    Ruby Butler, nice to meet you! Curious what's that? Keep reading to find out.
  </figcaption>
</figure>

## The Discovery

Ruby Butler started as a simple Bash script, just mangling a few environment variables needed by Ruby, RubyGems, and Bundler. To control the Ruby environment, all you really need is to put the desired Ruby’s `bin` directory in your `PATH` and set two variables — `GEM_HOME` (where to install gems) and `GEM_PATH` (`GEM_HOME` plus Ruby’s default gems). That’s it. That’s the whole “rocket science” behind tools like [chruby](https://github.com/postmodern/chruby/blob/a543a35790e5528b5a67de20e78a7390f5f7606e/share/chruby/chruby.sh).

Every Ruby environment tool I’d used — `chruby`, `rbenv`, and others — was tied tightly to the **shell** (mostly Bash and friends). That worked, but it often caused friction. You had to ensure your current shell instance matched the Ruby setup you wanted. Tools like `chruby-auto` helped a bit, but switching Rubies in the same shell session remained tricky. And on systems without a preinstalled Ruby — my preferred setup today — simply running `ruby` failed until everything was manually configured. I wanted something truly unified — cross-shell, cross-platform, and automatic. I wanted something that would automatically prepare the exact Ruby environment I’m looking for.

That’s where today’s **Ruby Butler** architecture was born.

## The Architecture

Ruby Butler builds on a simple idea: **Rubies are already on your system — you just need the right one at the right time.**
By default, it scans `~/.rubies` (for compatibility with tools like [ruby-install](https://github.com/postmodern/ruby-install)) and detects which versions are available. From there, it can automatically select the best Ruby for the current context — or let you decide manually.

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_runtime.png" 
      alt="Ruby Butler presenting detected runtimes." 
    >
  </picture>
  <figcaption>
    Ruby Butler presenting detected runtimes.
  </figcaption>
</figure>

But the real goal isn’t just *choosing* a Ruby version. It’s to **prepare a clean, ephemeral environment** where Ruby programs can run without leaving traces behind. This environment exists only for the duration of the command — no shell pollution, no manual resets. For quick scripts, the latest Ruby works just fine. If a `.ruby-version` file or a `Gemfile` with a `ruby` section is detected, Butler automatically switches to the matching version. And when you need something specific, you can ask explicitly: `rb -r 3.4.2`.

Everything runs through the `exec` command — `rb exec`, or simply `rb x`. It behaves as expected, with no setup needed unless the environment can’t be inferred. Ruby Butler is also smart enough to use **RubyGems binstubs**, eliminating the need for `bundle exec` or `bin/` prefixes. Working in a Rails app? Just run `rb x rails s`. I’ve been experimenting with a shorter alias, `rbx`, but haven’t fully settled on it yet.

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_exec.png" 
      alt="Ruby Butler executing commands in prepared environment!" 
    >
  </picture>
  <figcaption>
    Ruby Butler executing commands in prepared environment!
  </figcaption>
</figure>

Butler is also clever enough to **compose your Bundler environment automatically**. It runs `bundle check` and, if necessary, `bundle install` — all within its own isolated `.rb` folder. In practice, this means you can literally clone a project and run `rb x rspec`, and everything just works (unless, of course, other setup like a database is required).

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_exec_bundler.png" 
      alt="Ruby Butler executing commands in bundler prepared environment (with some debug info)!" 
    >
  </picture>
  <figcaption>
    Ruby Butler executing commands in bundler prepared environment (with some debug info)!
  </figcaption>
</figure>

## The Innovation

And finally, Ruby Butler lets you describe how your project should behave to elevate the overall developer experience. You don’t even have to start from scratch — just run **`rb init`**, and Butler will generate a basic **`rbproject.toml`** file for you. You can also use alternative names like **`gem.toml`**, or the **KDL** variants `rbproject.kdl` and `gem.kdl` if you prefer a more structured format.

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_toml.png" 
      alt="Ruby Butler rbproject.toml example"
    >
  </picture>
  <figcaption>
    Ruby Butler rbproject.toml example
  </figcaption>
</figure>

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_kdl.png" 
      alt="Ruby Butler rbproject.kdl example"
    >
  </picture>
  <figcaption>
    Ruby Butler rbproject.kdl example
  </figcaption>
</figure>

This marks the beginning of a **new, unified project format for Ruby** — something that could, in time, replace both gemspec and Gemfile. For now, it simply decorates your project with a **name** and a set of **scripts** — commands (optionally with descriptions) that appear as a clean, discoverable list in the CLI via `rb run`.

And the best part? The Butler **prepares the full environment for you automatically**, just as it does with the `exec` command. When you run `rb run test` or `rb run lint`, Butler silently sets up the correct Ruby, Bundler, and gem context behind the scenes, ensuring everything “just works.” No shell hacks, no manual setup, no guesswork — it’s all part of Butler’s service.

This format is still being explored in collaboration with other modern tools (like **rv**) and may grow into a new long-term standard. The goal is simple but ambitious: to make Ruby development feel **effortless, consistent, and joyful again**.

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_run.png" 
      alt="Ruby Butler run list example"
    >
  </picture>
  <figcaption>
    Ruby Butler run list example
  </figcaption>
</figure>

## The Future

Feel free to try out **Ruby Butler** ([github.com/RubyElders/ruby-butler](https://github.com/RubyElders/ruby-butler)) — maybe it will serve you well too. Personally, I’ve been using it as my **main Ruby development tool** for the past couple of months across **two systems — Windows and Linux** — with great success. It already runs an extensive integration test suite on both platforms: [**Pester** for PowerShell on Windows](https://github.com/RubyElders/ruby-butler/tree/667ca6da75025572d9427be72f4bfae34719f8c9/tests) and [**Shellspec** for Bash on Linux](https://github.com/RubyElders/ruby-butler/tree/667ca6da75025572d9427be72f4bfae34719f8c9/spec).

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_multi_ci.png" 
      alt="Ruby Butler being tested"
    >
  </picture>
  <figcaption>
    Ruby Butler being tested
  </figcaption>
</figure>

It doesn’t yet solve every problem I’ve encountered over the years with RubyGems and Bundler, but in my opinion, it’s already a **huge improvement** in everyday developer experience. I’d love to hear your ideas and feedback — on GitHub or anywhere else the Ruby conversation lives.

Since Ruby Butler operates in complete isolation, it **won’t interfere with your existing setup or tools**. Just make sure to add the `.rb` folder and `rbproject.toml` (or any of its variants) to your global `.gitignore` for now.

And one last note: please don’t use it in production yet. Ruby Butler is still **evolving rapidly**, and both its API and CLI flags are subject to change. But if you enjoy experimenting and helping Ruby move forward again — that’s exactly the kind of energy Butler was made to serve.

<figure class="wide">
  <picture>
    <img 
      src="/assets/img/writings/butler_debug.png" 
      alt="Ruby Butler can explain what's happening when asked via -v or -vv to be verbose." 
    >
  </picture>
  <figcaption>
    Ruby Butler can explain what's happening when asked via -v or -vv to be verbose.
  </figcaption>
</figure>

And have I mentioned it’s implemented in **Rust**? Curious why? I’ll explain that story — and what it enables — in one of the next posts.
And as for whether I’m still happy reusing Bundler and RubyGems after recent events… let’s just say that deserves its own story — coming soon. Time will tell how those tools evolve from here, and I’ll be watching closely.

---

## The Epilogue

During Ruby Butler’s early development, I shared early ideas and prototypes with several friends and respected members of the Ruby ecosystem — even before it was public on GitHub. To be transparent, I was also looking for potential **funding or interest** to see whether this kind of work could grow into something more official. I reached out to **Ruby Central**, offering them the opportunity to develop Ruby Butler under their umbrella as an **experimental incubator** — a safe space to test and validate new ideas that could later be **ported or integrated into RubyGems and Bundler** once proven useful.

The response was polite but simple: *there’s no interest or funding for this kind of development.*

More recently, I’ve also submitted a **grant proposal to the [Ruby Association](https://www.ruby.or.jp/en/)** — also rejected.
