# Ruby 3.2+ removed tainted?; Liquid 4.x still calls it. Define a no-op so Jekyll builds.
# See: https://github.com/Shopify/liquid/issues/1390

if !String.method_defined?(:tainted?)
  class String
    def tainted?
      false
    end
  end
end

if !Object.method_defined?(:tainted?)
  class Object
    def tainted?
      false
    end
  end
end
