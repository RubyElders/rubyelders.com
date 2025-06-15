require 'bundler/inline'

gemfile do
  gem "json"
  gem "erb"
  gem "kramdown"
end

require 'json'
require 'erb'
require 'date'
require 'fileutils'
require 'kramdown'

# Load writings.json
writings_data = JSON.parse(File.read('writings.json'))

# Build writing entries for rendering
writings = writings_data.map do |w|
  date = Date.strptime(w['published_at'], '%d.%m.%Y')
  {
    url: "writings/#{w['slug']}.html",
    title: w['title'],
    datetime: date.strftime('%Y-%m-%d'),
    released_at: date.strftime('%B %-d, %Y'),
    source: w['source'],
    slug: w['slug'],
    published_at: w['published_at'],
    author: w['author'],
    author_avatar_url: w['author_avatar_url'],
    place: w['place']
  }
end

# Load layout and list templates
layout_template = File.read('_layout.html.erb')
list_template = File.read('_list.html.erb')
post_template = File.read('_post.html.erb')

# Generate writings index page
@writings = writings
@content = ERB.new(list_template).result(binding)
html_output = ERB.new(layout_template).result(binding)
File.write('writings.html', html_output)
puts "Generated writings.html with #{writings.size} posts."

# Ensure writings directory exists
FileUtils.mkdir_p('writings')

# Generate individual post pages
writings.each do |w|
  markdown = File.read(w[:source])
  @writing = w
  @content = Kramdown::Document.new(markdown).to_html

  # Render the post template with writing and HTML content
  @content = ERB.new(post_template).result(binding)

  # Now inject post content into layout
  full_html = ERB.new(layout_template).result(binding)

  # Write to file
  File.write("writings/#{w[:slug]}.html", full_html)
  puts "Generated writings/#{w[:slug]}.html"
end
