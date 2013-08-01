function OrgView () {

  var _self = this;

  this.width = 500,
  this.height = 300;
  this.color = d3.scale.category10();
  // this.color = d3.scale.category20c();
  this.updateInterval = 5;

  this.orgs = []

  var orgView = this;

  setInterval(function() {
    orgView.updateAppStats();
  }, 1000 * 60 * this.updateInterval);

}


OrgView.prototype.loadApps = function(space) {

  var orgView = this;
  var guid = space.data.guid;

  d3.json("/space/" + guid, function(error, json) {

    if (error == null) {

      space.data = json;

      var apps = {
        name : "root",
        children : json.apps
      }

      // create layout for space
      space.nodes = d3.layout.pack()
        .value(function(d) { return d.memory * d.instances; }) // create calculation for size based on a allocation
        .size([orgView.width - 10, orgView.height - 10])
        .padding(50 / apps.children.length)
        .nodes(apps);

      space.nodes.shift();

      space.labelNodes = [];
      space.labelLinks = [];

      var i = 0;

      _.each(space.nodes, function(app) {

        var o = {
          id: i,
          x: app.x + 5,
          y: app.y + 5,
          fixed: true,
          name: '',
          url: ''
        };

        var t = {
          id: i+1,
          name: app.name,
          url: app.urls[0],
          o: o
        };

        space.labelNodes.push(o);

        space.labelNodes.push(t);

        space.labelLinks.push({
          source: i,
          target: i+1,
        });

        i+=2;

      });

      var link;
      var node;

      var labelG = space.svg.append("g")
        .attr('class', 'labels');

      //create force layout for labels
      space.labelLayout = d3.layout.force()
        .nodes(space.labelNodes)
        .links(space.labelLinks)
        .size([orgView.width, orgView.height])
        .linkDistance(75)
        .charge(-100)
        .on("tick", function () {

          node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })

          link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });


              // 


              // console.log(theta);

          labelG.selectAll(".app-title")
            .attr("transform", function(d) {
              return "translate(" + (d.x + 5) + "," + (d.y + 2) + ")";
            })
            .attr("x", function(d) {
              var theta = 0;

              if (d.o != null) {
                var dy = d.y - d.o.y
                var dx = d.x - d.o.x
                theta = Math.atan2(dy, dx)
                theta *= 180 / Math.PI

              }

              return (theta > -90 && theta < 90) ? 0 : -(this.getComputedTextLength() + 10); 
            })

        });
 
      link = labelG.selectAll(".label-link")
        .data(space.labelLinks).enter().insert("line", ".node").attr("class", "label-link");

      node = labelG.selectAll(".label-node")
        .data(space.labelNodes).enter()
        .append('text')
        .attr('class', 'app-title')
        .attr('x', function(d) { return 0; })
        .attr('y', function(d) { return 0; })

        .text(function(d) { return d.url; });

      space.labelLayout.start();

      orgView.drawAppsInSpace(space);
      orgView.updateAppStats(space);

    } else {

      console.log(error.response);

      // remove the space if we can't retrieve the summary
      space.svg.remove();

      var org = space.parent;
      var index = org.spaces.indexOf(space);
      org.spaces.splice(index, 1);
    }
  });
  
};

OrgView.prototype.loadOrgs = function(orgs, callback){
  
  var orgView = this;

  _.each(orgs, function(org) {

    var newOrg = new Object();
    
    newOrg.spaces = []

    _.each(org.spaces, function(space) {
      
      var newSpace = new Object();

      newSpace.svg = d3.select("body").append("svg")
        .attr("width", orgView.width)
        .attr("height", orgView.height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", "1.1")
        
      newSpace.svg.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .text(org.name + " : " + space.name)

      var borderPath = newSpace.svg.append("rect")
        .attr("class", "svg-border")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", orgView.height)
        .attr("width", orgView.width)

      newSpace.data = space;
      newSpace.parent = newOrg;
      newOrg.spaces.push(newSpace);
    });

    orgView.orgs.push(newOrg);

    callback(newOrg);
  });

};

OrgView.prototype.updateAppStats = function(space) {

  var orgView = this;
  var orgsToUpdate = [];

  if (space == null) {
    _.each(orgsToUpdate.orgs, function(org) {
      _.each(org.spaces, function(space){
        _.each(space.data.apps, function(app) {
          d3.json("/app/" + app.guid, function(error, json) {
            app.stats = json[0];
            app.space = space;
            orgView.drawAppInSpace(app);
          });
        });
      });
    });
  } else {
    _.each(space.data.apps, function(app) {
      d3.json("/app/" + app.guid, function(error, json) {
        app.stats = json[0];
        app.space = space;
        orgView.drawAppInSpace(app);
      });
    });    
  }
}

OrgView.prototype.drawAppInSpace = function(app) {
  
  if (app.color == null) app.color = this.color(app.guid)

  var appNode = app.space.svg.selectAll('circle#app' + app.guid);
  appNode.remove();

  // outer circle for app
  appNode.data([app])
    .enter()
    .insert('svg:g', '.labels')
    .style('stroke', function(d) { return d3.rgb(d.color).brighter(0.5); })
    .append('svg:circle')
    .attr('id', function(d) { return 'app-' + d.guid; })
    .attr('class', 'app-node')
    .attr('cx', function(d) { return d.x + 5; })
    .attr('cy', function(d) { return d.y + 5; })
    .attr('r', function(d) { return d.r; });

  appNode.data([app])
    .enter()
    .insert('svg:g', '.labels')
    .append('svg:circle')
    .attr('id', function(d) { return 'app-memory-' + d.guid; })
    .attr('class', 'resource-node')
    .attr('cx', function(d) { return d.x + 5; })
    .attr('cy', function(d) { return d.y + 5; })
    .attr('r', function(d) { 
      if (d.stats == null) return 0;
      if (d.stats.stats == null) return 0;
      var ratio =  d.stats.stats.usage.mem / (d.memory * d.instances * 1048576)
      return d.r * ratio; 
    })
    .attr('fill', function(d) { return d.color; });

};

OrgView.prototype.drawAppsInSpace = function(space) {

  var orgView = this;

  _.each(space.nodes, function (app) { 
    app.space = space;
    orgView.drawAppInSpace(app); 
  })

};





