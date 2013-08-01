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
    erb :index, :locals => {:orgs => @viz_client.organization_summary.to_json}
  end

  get '/organizations/?' do
    content_type 'application/json'
    @viz_client.organization_summary.to_json
  end

  get '/space/*' do
    guid = params[:splat]
    begin
      @viz_client.space(guid).summary.to_json
    rescue CFoundry::NotAuthorized
      halt 403, 'Not Authorized For This Space!'
    end
  end

  get '/app/*' do
    guid = params[:splat]
    begin
      @viz_client.app(guid).stats.to_json
    rescue CFoundry::NotAuthorized
      halt 403, 'Not Authorized For This App!'
    end
  end

  get '/spaces/?' do
    content_type 'application/json'
    @viz_client.space_summary.to_json
  end

end