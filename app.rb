require 'sinatra/base'
require 'json'
require './lib/viz_client'

class CFOrgVizApp < Sinatra::Base

  def initialize
    @viz_client = VizClient.new
    super
  end

  set :public_folder, 'public'

  get '/' do
    erb :index
  end

  get '/organizations/?' do
    content_type 'application/json'
    @viz_client.organization_summary.to_json
  end

end