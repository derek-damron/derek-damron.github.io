source "https://rubygems.org"

# Ruby 3.2+ removed tainted?; Liquid 4.x calls it. Load patch before Jekyll/Liquid.
require_relative "_plugins/taint_compat" if File.exist?(File.join(__dir__, "_plugins", "taint_compat.rb"))

gem "bigdecimal"
gem "csv"
gem "webrick"
gem "github-pages", group: :jekyll_plugins
