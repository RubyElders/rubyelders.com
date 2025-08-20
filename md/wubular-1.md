*Ever wished a Ruby app could run entirely in your browser, without talking to a remote server? That’s the spark behind **Wubular** — Rubular reborn, powered by Ruby compiled to WebAssembly.*

If you’ve been around Ruby for a while, you probably know [**Rubular**](https://rubular.com/) — my long-time favorite little tool for quickly composing and testing regular expressions. I’ve used it countless times, but it’s starting to show its age: according to the app’s footer, it still runs on an older Ruby. At one point I even considered stepping in to help keep it maintained and upgraded…

But then it hit me: why not just run it directly in the browser? Since Ruby 3.2, the language has had native WebAssembly support. That not only makes Rubular-style apps possible entirely client-side, it also opens up fun extras like **dynamic Ruby version selection right in the browser**. (And really — can you imagine the headache of trying to support multiple Rubies on the server, juggling deployments and interpreters?) With Wubular, there are no server round-trips and no JS framework sprawl — just Ruby, running natively in your browser.

---

## Rubular’s classic architecture

Rubular has always been a simple and brilliant idea: a textbox for your regex, a textbox for your test string, and instant feedback. Under the hood, though, it’s a pretty old-school **server–client app**.

The frontend is plain HTML + JavaScript. Every time you type, the JS layer serializes the form and fires off a **POST** request to the server:

~~~ javascript
POST /regex/do_test?message_id=123
Content-Type: application/x-www-form-urlencoded

utf8=✓&regex=ss&options=&test=ss&word_wrap=1&_=...
~~~

The Ruby backend receives that payload, runs the regex against the test string, and responds with an HTML snippet:

~~~ javascript
Rubular.handleParseResult({
    "message_id": 1,
    "error_message": null,
    "retry": null,
    "html": "  \u003cdiv class=\"match_result\"\u003e\n    \u003cspan class=\"result_label\"\u003eMatch result:\u003c/span\u003e\n    \u003cdiv id=\"match_string\" class=\"\"\u003e\u003cspan id=\"match_string_inner\"\u003e\u003cspan class=\"match\"\u003ejj\u003c/span\u003e\u003c/span\u003e\u003c/div\u003e\n  \u003c/div\u003e\n"
});
~~~

The JS then updates the `<div id="result">` in place. A bit of Ajax-era magic: spinners, retries, even a “make permalink” endpoint.

It worked great in its time — but it comes with obvious downsides:

* **Server load**: every keystroke means a round-trip to the backend.
* **Latency**: regex results lag behind your typing.
* **Maintenance**: the server must stay up, patched, and running a Ruby interpreter just to evaluate regexes.

---

## Ruby in the Browser

Enter the **WebAssembly (WASM)** era!

Since Ruby 3.2, the official interpreter can be compiled to run inside a WASM environment. WASM is the “assembly for the web” — a safe, fast, portable bytecode that browsers (and other runtimes) can execute. Pair it with **WASI** (WebAssembly System Interface) and you get access to things like files, clocks, and randomness, making it possible to run real-world Ruby apps in the browser.

That flips the old Rubular model on its head. Regex evaluation (and any Ruby code) can now happen **entirely client-side**. The benefits are huge:

* **No server**: nothing to deploy, patch, or scale.
* **Instant feedback**: results show up as you type, with zero network latency.
* **Privacy**: your test strings never leave your browser.
* **Zero build**: you only need a static HTML page and your Ruby files.

It’s still the same MRI Ruby under the hood — only now it runs right inside your browser tab.

---

## Meet Wubular

Enter **Wubular** — a Rubular clone that runs entirely in your browser.

It works just like the original: type a regexp, set your options, type a test string, and instantly see the result. The difference is, there’s no backend doing the work anymore. The Ruby interpreter itself is compiled to WebAssembly, and the app logic lives in plain `.rb` files. Those files are loaded into the browser via `<script type="text/ruby" src="app.rb">` — yes, the source code you see is really Ruby.

What’s even more interesting is *how* it works: the DOM is manipulated directly from Ruby. Each part of the UI is wrapped in a Ruby class that behaves like a component — it can be mounted and later unmounted. It’s just the beginning of a component model in Ruby for the browser. There aren’t any polished frameworks yet for handling events, bindings, or DOM updates — but Ruby doesn’t need to reinvent the wheel. Using the built-in `js` library (`require "js"`), Ruby code can talk directly to native JavaScript APIs like `document.querySelector` or `addEventListener`.

And yes — it’s this simple:

~~~ html
<body>
  <script src="https://cdn.jsdelivr.net/npm/@ruby/3.4-wasm-wasi@latest/dist/browser.script.iife.js"></script>

  <script type="text/ruby">
    require "js"
    document = JS.global[:document]
    document.querySelector("body")[:innerHTML] = "Hello from #{RUBY_DESCRIPTION}!"
  </script>
</body>
~~~

Load Ruby, add a `<script type="text/ruby">`, `require "js"`, and you’re updating the DOM straight from Ruby.

Here’s a slightly richer example — two inputs and a checkbox. Whenever you type, Ruby checks if the regex matches the text:

~~~ html
<body>
  <script src="https://cdn.jsdelivr.net/npm/@ruby/3.4-wasm-wasi@latest/dist/browser.script.iife.js"></script>

  <input id="regex" placeholder="Regex (e.g. cat)" />
  <input id="text" placeholder="Text (e.g. my cat)" />
  <label>
    Match?
    <input type="checkbox" id="result" disabled />
  </label>

  <script type="text/ruby">
    require "js"
    doc = JS.global[:document]

    regex_input = doc.getElementById("regex")
    text_input  = doc.getElementById("text")
    result_box  = doc.getElementById("result")

    handler = proc do |_|
      begin
        re = Regexp.new(regex_input[:value].to_s)
        text = text_input[:value].to_s
        result_box[:checked] = !re.match(text).nil?
      rescue RegexpError
        result_box[:checked] = false
      end
    end

    regex_input.addEventListener("input", handler.to_js)
    text_input.addEventListener("input", handler.to_js)
  </script>
</body>
~~~

That’s it: two inputs, one checkbox, and a handful of Ruby lines including stdlib running in your browser — no JS required. This is exactly how initial prototype of Wubular was born.

---

## 🚀 Ruby, WASM, and the Future of Browser Apps

This was just the introduction. Wubular is already usable today — paste a regex, type your test string, and see the result instantly — but it’s also a living experiment. You can freely explore its code: all the Ruby source files are right there in the browser (just pop open DevTools → Network), or head to GitHub. Fun fact: the whole prototype started life on CodeSandbox.io.

And here’s the kicker: Wubular isn’t just a toy demo — it’s fully tested. Like any healthy Ruby app, it ships with an automated test suite, but here it runs with native Ruby tools. In Wubular’s case, that means good old Minitest, running right inside your browser. Just open the browser console, append `?run_test` to the URL, and watch. The speed of integration testing is wild — full runs complete in mere milliseconds. Imagine a future where web apps verify themselves with their own Ruby test suite before even starting up on client side.

So is this where web apps are heading? Maybe. For now, enjoy exploring Wubular, poke at the source, and try running tests in your own browser. The next post will dive deeper into its internals: component-based Ruby in the browser, test-driven development in a new Ruby browser runtime, and why the speed feels almost unreal.
