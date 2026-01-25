Ruby lives in a single global object space. Classes, modules, and constants can see each other, reopen each other, and override each other freely. This is one of Ruby’s greatest design strengths: it enables expressive DSLs, powerful metaprogramming, and a level of flexibility that few languages can match. At the same time, it comes with a cost. When everything is global, isolation is difficult, and undoing already executed code — especially code that has already been loaded — quickly becomes problematic.

Ruby developers value fast feedback loops, yet restarting a web server breaks flow, and safely reloading code inside a long-running process is fragile by nature. Once a file is loaded or a constant is defined, the runtime offers no simple way to rewind that state.

Current reloading tools tackle this in different ways:
- <img src="https://avatars.githubusercontent.com/u/3387?v=4" class="avatar"> [Xavier Noria's (@fxn)](https://github.com/fxn) [Zeitwerk](https://github.com/fxn/zeitwerk) tracks and unloads all reloadable constants on every change
- <img src="https://avatars.githubusercontent.com/u/3846?v=4" class="avatar"> [Jeremy Evans's (@jeremyevans)](https://github.com/jeremyevans) [rack-unreloader](https://github.com/jeremyevans/rack-unreloader) selectively unloads only the constants that changed
- <img src="https://avatars.githubusercontent.com/u/404?v=4" class="avatar"> [Ryan Tomayko's (@rtomayko)](https://github.com/rtomayko) [shotgun](https://github.com/rtomayko/shotgun) forks the process and uses IPC (inter-process communication) to handle each request in isolation

They are effective, but they all fight Ruby's shared global object space. With [`Ruby::Box`](https://docs.ruby-lang.org/en/4.0/Ruby/Box.html), there's a different approach — load code in isolation, use it, and discard the entire world afterwards.

---

Let's see the problem in action with a simple Rack app in `config.ru` file.

```ruby
# config.ru
class HelloApp
  LOADED = Time.now

  def self.call(env)
    http_status = 200
    headers = {'content-type' => 'text/html'}
    body = <<~HTML
        <h1>Hello from test app!</h1>
        <p>Edit config.ru and reload to see changes</p>
        <i>Loaded at #{LOADED}.</i>
    HTML

    [http_status, headers, [body]]
  end
end

run HelloApp
```

The `LOADED = Time.now` constant is evaluated once at boot and never changes across requests.

To run a simple Rack app, install the [`rackup`](https://rubygems.org/gems/rackup) gem and some HTTP server (like [`webrick`](https://rubygems.org/gems/webrick)) with `gem install rackup webrick`. Save the code above as `config.ru` and run with `rackup config.ru` - it'll expose the app on [http://localhost:9292](http://localhost:9292) (check output if different). Navigate in a browser and refresh - the `LOADED` timestamp appears. Now edit the file and refresh again - nothing changes, the timestamp stays frozen. Restart the server manually and refresh - only now the update appears.

*Notice the `run` method call. That's how a Rack app tells the server where the entry point is. By default Rack servers expect this file to be named `config.ru`. This same pattern appears in [`Rails`](https://rubygems.org/gems/rails) apps - Rails is a valid Rack app.*

---

## Boxed Rack Reload

Using [`Ruby::Box`](https://docs.ruby-lang.org/en/4.0/Ruby/Box.html) it's possible to create a separate Ruby "namespace" next to the main one. This namespace doesn't share anything with the top-level environment. It can be created on the fly using [`Ruby::Box`](https://docs.ruby-lang.org/en/4.0/Ruby/Box.html) calls. Let's put this together and create an auto-reloading Rack server that loads the host app on each request into a separate [`Ruby::Box`](https://docs.ruby-lang.org/en/4.0/Ruby/Box.html).

I have released my naive PoC implementation as the self-hosted [`rackup-box`](https://github.com/RubyElders/rackup-box) gem. To try it locally, install with:

```bash
gem install rackup-box --clear-sources --source https://rubyelders.github.io/rackup-box --source https://gem.coop
```

Create a `config.ru` file with the Rack app example from above and run:

```bash
RUBY_BOX=1 rackup-box config.ru
```

The app runs on [http://localhost:9292/](http://localhost:9292/). Now refresh the page - the `LOADED` timestamp changes with each request. Edit `config.ru` and refresh again - the changes appear immediately. No server restart needed.

See the magic? Ruby reloaded the file on each web request - no constant tracking, no forking, no preloading, no complex inter-process communication. Just a clean isolated namespace that appears, serves the request, and disappears.

Here's how it works - the complete commented implementation:

```ruby
require 'rack'
require 'rackup'

# load specified rack app or standard rackup file
config_file = ARGV[0] || 'config.ru'

class BoxReloader
  def initialize(config_file)
    @config_file = File.expand_path(config_file)
  end

  def call(env)
    box = Ruby::Box.new # creates new isolated namespace
    box.eval("def run(app) = $app = app") # load shim to mimic rack server
    box.require(@config_file) # let box load the app
    app = box.eval('$app') # expose the loaded app back to main namespace

    app.call(env) # execute app request
  end
end

# start reloader using rackup and webrick HTTP server
app = BoxReloader.new(config_file)
Rackup::Handler::WEBrick.run(app, Port: 9292, Host: '127.0.0.1')
```

---

## What's next?

### Can it reload [`Sinatra`](https://rubygems.org/gems/sinatra) or [`Rails`](https://rubygems.org/gems/rails) app? Not yet.

I often craft small one-file [`Sinatra`](https://rubygems.org/gems/sinatra) apps to prototype or design APIs. Since a Sinatra app is also a valid Rack app, it should be as simple as using the same [`rackup-box`](https://github.com/RubyElders/rackup-box) reloader, right?

Not quite yet. Try it - the error reveals an interesting limitation.

To load a [`Sinatra`](https://rubygems.org/gems/sinatra) app, Sinatra and its dependencies need to be loaded. [`Ruby::Box`](https://docs.ruby-lang.org/en/4.0/Ruby/Box.html) currently doesn't support loading RubyGems - the list of activated gems and some RubyGems internals are still shared globally. This is a known limitation of the experimental implementation and RubyGems design.

*It is actually possible to load Sinatra using a few tricks. I'll explore a workaround in another writing. Stay tuned.*

### Current Limitations

Boxes don't seem to release memory as expected. Even in the simple `BoxReloader` case, I tested with 100k requests and observed continuous memory growth, even when manually calling `GC.start`. There are also occasional segfaults I have not been able to consistently reproduce yet. I'll continue exploring and report.

---

[`Ruby::Box`](https://docs.ruby-lang.org/en/4.0/Ruby/Box.html) shows real promise for solving Ruby's long-standing code reloading challenges. The approach is elegant - instead of fighting Ruby's global namespace, embrace isolation. While it's still experimental and has rough edges, the core concept works beautifully for simple cases. As the implementation matures and gains dependencies loading support, it could transform how we develop Ruby applications.

Worth watching this space.
