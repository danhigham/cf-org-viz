require 'cfoundry'
require 'yaml'

class VizClient < CFoundry::V2::Client

  def initialize
    endpoint, token = local_token_endpoint
    super endpoint, token
  end

  def organization_summary
    organizations.collect { |o| o.summary }
  end

  def spaces_summary
    spaces.collect { |o| o.summary }
  end

  private

  def local_token_endpoint
    home = ENV['HOME']
    # endpoint = 'https://api.dan-cloud-eu.gopaas.eu'
    endpoint = 'https://api.run.pivotal.io'
 
    config = YAML.load File.read("#{home}/.cf/tokens.yml")
    token = CFoundry::AuthToken.from_hash config[endpoint]
 
    [endpoint, token]
  end

end
