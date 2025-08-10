require 'bundler/inline'

gemfile(true) do
  source 'https://rubygems.org'

  gem "json"
  gem "erb"
  gem "kramdown"
  gem "nokogiri"
end

require 'json'
require 'erb'
require 'date'
require 'fileutils'
require 'kramdown'
require 'nokogiri'

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
    author_url: w['author_url'],
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
@title = "Writings"
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
  @title = w[:title]
  @content = Kramdown::Document.new(markdown).to_html

  # Render the post template with writing and HTML content
  @content = ERB.new(post_template).result(binding)
  # Outside links to new window
  @content = Nokogiri::HTML.fragment(@content).tap do |doc|
    doc.css('a').each do |node|
      node['href'] ||= '#'
      # Add attributes to external links only:
      if node['href'] =~ %r{\A(?:\w+:)?//}
        node['target'] = '_blank'
        node['rel'] = 'nofollow noopener'
      end
    end
  end.to_html

  # Now inject post content into layout
  full_html = ERB.new(layout_template).result(binding)

  # Write to file
  File.write("writings/#{w[:slug]}.html", full_html)
  puts "Generated writings/#{w[:slug]}.html"
end
