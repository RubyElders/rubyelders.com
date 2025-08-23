*Ever wished a Ruby app could run entirely in your browser, without ever calling back to a server? That’s what sparked [**Wubular**](https://rubyelders.github.io/wubular) — a [**Rubular**](https://rubular.com/) remake, powered by Ruby compiled to [WebAssembly](https://webassembly.org/) running natively in the browser.*

If you’ve been around Ruby, you probably know [**Rubular**](https://rubular.com/) — the de-facto standard tool created by <img src="https://avatars.githubusercontent.com/u/22803?v=4" class="avatar"> [Michael Lovitt (@lovitt)](https://github.com/lovitt) back in 2007 for quickly composing and testing [Ruby regular expressions](https://www.ruby-lang.org/en/). I’ve relied on it countless times, but the app itself now feels a bit outdated — for example, the footer shows it’s still running on an old Ruby. On top of that, Rubular isn’t open source (at least I haven’t been able to find any code published), so the only way I thought I might help was by reaching out to the original author and offering some community support.

<figure>
  <picture>
    <img 
      src="/assets/img/writings/wubular_rubular.png" 
      alt="Original Rubular webapp" 
    >
  </picture>
  <figcaption>
    Original Rubular website preview.
  </figcaption>
</figure>

But then it hit me: why not just run it directly in the browser? Since Ruby 3.2, the language has had native WebAssembly support. That doesn’t just make Rubular-style apps possible entirely client-side — it opens up wild ideas like **switching Ruby versions right in the browser**. (And really — can you imagine the nightmare of juggling multi-Ruby deployments on a server?) With WebAssembly, there are no server round-trips, no JS framework sprawl — just Ruby, running natively in your browser.

---

## Rubular’s classic architecture

Rubular was a brilliant little invention: just a regex box, a test string box, and instant feedback. Behind the curtain, though, it’s a traditional **server–client setup**.

The frontend is plain HTML + JavaScript. Each time you type, the JS serializes the form and fires off a **POST** request to the backend:

```http
POST /regex/do_test?message_id=123
Content-Type: application/x-www-form-urlencoded

utf8=✓&regex=ss&options=&test=ss&word_wrap=1&_=...
```

The Ruby server evaluates the regex and responds with an HTML snippet:

```javascript
Rubular.handleParseResult({
  "message_id": 1,
  "error_message": null,
  "retry": null,
  "html": "<div class='match_result'>…</div>"
});
```

The browser then updates the results in place. Classic Ajax magic — spinners, retries, even a “permalink” endpoint.

It worked great in its day, but it comes with obvious costs:

* **Server load**: every keystroke means backend work.
* **Latency**: results lag behind your typing.
* **Maintenance**: you need a running Ruby backend *just to check regexes*.

---

## Ruby in the Browser

Now enter **[WebAssembly (WASM)](https://webassembly.org/)**.

Since [Ruby 3.2](https://www.ruby-lang.org/en/news/2022/12/25/ruby-3-2-0-released/), MRI itself [can be compiled](https://github.com/ruby/ruby/pull/5407) — thanks to <img src="https://avatars.githubusercontent.com/u/11702759?v=4" class="avatar"> [Yuta Saito (@kateinoigakukun)](https://github.com/kateinoigakukun) — to run in WASM environments. WASM is essentially *assembly for the web*: safe, fast, portable bytecode that browsers (and other runtimes) can execute. Combine it with [**WASI**](https://wasi.dev/) (WebAssembly System Interface) and you get access to basic system features like files, time, and randomness — enough to run full Ruby apps.

That flips the old Rubular model upside down: regex evaluation (and any Ruby code) can now run **entirely client-side**.

* **No servers**: nothing to deploy or scale.
* **Instant feedback**: results as you type, with zero network round-trips.
* **Privacy**: test strings never leave your browser.
* **Zero build**: just static HTML + Ruby files.

It’s still the same Ruby you know — now just living inside a browser tab.

---

## Meet [Wubular](https://rubyelders.github.io/wubular)

[**Wubular**](https://rubyelders.github.io/wubular) is a Rubular clone that runs 100% in your browser.

For users, it feels the same: paste a regexp, pick options, type a test string, and see results instantly. But under the hood, everything changed:

* The Ruby interpreter is compiled to WebAssembly.
* App logic is plain `.rb` files, loaded with `<script type="text/ruby" src="app.rb">`.
* The DOM is manipulated directly from Ruby classes that behave like components — mount, unmount, react to events.

There aren’t polished Ruby-in-the-browser frameworks yet, but Ruby doesn’t need to reinvent the wheel. Using the built-in `js` library (`require "js"`), Ruby can talk to native browser APIs like `document.querySelector` or `addEventListener`.

It really is this simple, just try it:

<iframe src="https://codesandbox.io/embed/xpjsns?view=split&module=%2Findex.html&editorsize=65&runonclick=1&hidenavigation=1"
     style="width:100%; height: 350px; border:0; border-radius: 4px; overflow:hidden;"
     title="ruby-wasm-hello-world"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

Or, a slightly richer one: a regex input, a text input, and a checkbox that updates live:

<iframe src="https://codesandbox.io/embed/nlwj4q?view=split&module=%2Findex.html&editorsize=65&runonclick=1&hidenavigation=1"
     style="width:100%; height: 800px; border:0; border-radius: 4px; overflow:hidden;"
     title="ruby-wasm-hello-world"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

That’s exactly how the first Wubular prototype came to life.

---

## Ruby, WASM, and the Future of Browser Apps

Wubular is already [live](https://rubyelders.github.io/wubular) and usable — paste a regex, type your string, and see results instantly. But it’s also an experiment in what Ruby + WASM makes possible.

And here’s the kicker: Wubular isn’t just a quick prototype — it’s also a fully tested app, developed with [TDD](https://en.wikipedia.org/wiki/Test-driven_development). Like any serious Ruby project, it ships with an automated test suite. The difference? It also runs directly in your browser, using the same tools you’d use locally. In Wubular’s case, that’s good old [**Minitest**](https://github.com/minitest/minitest/). Open the [DevTools console](https://en.wikipedia.org/wiki/Web_development_tools) in your browser, append `?run_tests` to the URL, and watch the results fly by. Full integration test runs complete in milliseconds. Imagine if client-side apps booted only after passing their own test suite locally.

**PRO TIP: You can combine various Ruby versions with `run_tests` parameter like `?ruby=3.2&run_tests`.**

<figure>
  <picture>
    <img 
      src="/assets/img/writings/wubular_minitest_browser.png" 
      alt="Wubular test suite running in the browser" 
    >
  </picture>
  <figcaption>
    Wubular’s test suite running directly in the browser with Minitest.
  </figcaption>
</figure>

This is the first post in the Wubular series. In the next one, I’ll dig into the internals: how Wubular mounts Ruby components in the DOM, how test-driven development feels when everything runs in the browser, and why the speed feels almost unreal.

In the meantime, go explore: the source is [right there](https://rubyelders.github.io/wubular) in DevTools → Network, or [up on GitHub](https://github.com/RubyElders/wubular). Have fun, try to run the tests, and imagine what else Ruby in the browser might unlock.

**Stay connected!** [Mastodon](https://ruby.social/@rubyelders), [Bluesky](https://rubyelders.bsky.social) or [Twitter/X](https://x.com/RubyElders).
