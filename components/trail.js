AFRAME.registerComponent('trail', {
   init: function () {
    var geometry = this.geometry = new THREE.BufferGeometry();
    var steps = 10;
    var maxPoints = this.maxPoints = 12;
    var vertices = this.vertices = new Float32Array(36 * maxPoints); 
    var colors = this.colors = new Float32Array(48 * maxPoints);

    this.layers = 0;
    //this.saberTrayectory = [];
    this.saberTrayectory = [
      {top: {x:-0.5, y: 0, z: 0}, center: {x: 0, y: 0, z: 0}, bottom: {x: 0.5, y: 0, z: 0}},
      {top: {x:-0.5, y: 0.5, z: 0}, center: {x:0, y: 0.5, z: 0}, bottom: {x: 0.5, y: 0.5, z: 0}},
      {top: {x:-0.5, y: 1.0, z: 0}, center: {x:0, y: 1.0, z: 0}, bottom: {x: 0.5, y: 1.0, z: 0}}
    ];

    //geometry.setDrawRange(0, 0);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3).setDynamic(true));
    geometry.addAttribute('vertexColor', new THREE.BufferAttribute(colors, 4).setDynamic(true));
    
    var material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexColors: THREE.VertexColors,
      transparent: true,
      vertexShader: [
        'varying vec4 vColor;',
        'attribute vec4 vertexColor;',
        'void main() {',
          'vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);',
          'vColor = vertexColor;',
          'gl_Position = projectionMatrix * modelViewPosition;',
        '}'
      ].join(''),
      fragmentShader: [
        'varying vec4 vColor;',
        'void main() {',
          'gl_FragColor = vColor;',
        '}'
      ].join('')
    });

    //this.initGeometry();
    var mesh = this.mesh = new THREE.Mesh(geometry, material);
    // var material = new THREE.MeshBasicMaterial({color: 0xffff00});
    // var wireframe = new THREE.WireframeGeometry(geometry);
    // var mesh = new THREE.LineSegments(wireframe, material);

    mesh.frustumCulled = false;
    mesh.vertices = vertices;
    //mesh.scale.set(0.4, 0.4, 0.4);
    //mesh.rotation.set(0, 0, Math.PI / 2.0);
    this.el.setObject3D('trail', mesh);
  },

  addLayer: function (length) {
    var startX = -1.0;
    var segments = this.segments;
    var dx = 2 / segments;
    var colors = this.colors;
    var bottomLayer;
    var vertices = this.vertices;
    var uvs = this.uvs;
    var indexOffset;
    var color = {
      red: 0.59,
      green: 0.74,
      blue: 0.98,
      alpha: 1.0
    };

    if (this.layers >= this.maxLayers) { this.layers = 0; }

    bottomLayer = this.layers * length;
    length = bottomLayer + length;
    indexOffset = this.layers * segments * 18;
    colorOffset = this.layers * segments * 24;

    for (var i = 0; i < segments; ++i) {
      vertices[indexOffset + 18 * i] = startX + i * dx;
      vertices[indexOffset + 18 * i + 1] = bottomLayer;
      vertices[indexOffset + 18 * i + 2] = 0.0;

      // Color
      colors[colorOffset + 24 * i] = color.red;
      colors[colorOffset + 24 * i + 1] = color.green;
      colors[colorOffset + 24 * i + 2] = color.blue;
      colors[colorOffset + 24 * i + 3] = color.alpha;

      vertices[indexOffset + 18 * i + 3] = startX + i * dx;
      vertices[indexOffset + 18 * i + 4] = length;
      vertices[indexOffset + 18 * i + 5] = 0.0;

      // Color
      colors[colorOffset + 24 * i + 4] = color.red;
      colors[colorOffset + 24 * i + 5] = color.green;
      colors[colorOffset + 24 * i + 6] = color.blue;
      colors[colorOffset + 24 * i + 7] = color.alpha;

      vertices[indexOffset + 18 * i + 6] = startX + i * dx + dx;
      vertices[indexOffset + 18 * i + 7] = length;
      vertices[indexOffset + 18 * i + 8] = 0.0;

      // Color
      colors[colorOffset + 24 * i + 8] = color.red;
      colors[colorOffset + 24 * i + 9] = color.green;
      colors[colorOffset + 24 * i + 10] = color.blue;
      colors[colorOffset + 24 * i + 11] = color.alpha;

      vertices[indexOffset + 18 * i + 9] = startX + i * dx + dx;
      vertices[indexOffset + 18 * i + 10] = bottomLayer;
      vertices[indexOffset + 18 * i + 11] = 0.0;

      // Color
      colors[colorOffset + 24 * i + 12] = color.red;
      colors[colorOffset + 24 * i + 13] = color.green;
      colors[colorOffset + 24 * i + 14] = color.blue;
      colors[colorOffset + 24 * i + 15] = color.alpha;

      vertices[indexOffset + 18 * i + 12] = startX + i * dx;
      vertices[indexOffset + 18 * i + 13] = bottomLayer;
      vertices[indexOffset + 18 * i + 14] = 0.0;

      // Color
      colors[colorOffset + 24 * i + 16] = color.red;
      colors[colorOffset + 24 * i + 17] = color.green;
      colors[colorOffset + 24 * i + 18] = color.blue;
      colors[colorOffset + 24 * i + 19] = color.alpha;

      vertices[indexOffset + 18 * i + 15] = startX + i * dx + dx;
      vertices[indexOffset + 18 * i + 16] = length;
      vertices[indexOffset + 18 * i + 17] = 0.0;

      // Color
      colors[colorOffset + 24 * i + 20] = color.red;
      colors[colorOffset + 24 * i + 21] = color.green;
      colors[colorOffset + 24 * i + 22] = color.blue;
      colors[colorOffset + 24 * i + 23] = color.alpha;
    }

    this.layers++;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.vertexColor.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
  },

  initGeometry: function () {
    var i;
    var previousPoint;
    var currentPoint;
    var saberTrayectory = this.saberTrayectory;
    var vertices = this.geometry.attributes.position.array;
    var colors = this.geometry.attributes.vertexColor.array;
     var color = {
      red: 0.59,
      green: 0.74,
      blue: 0.98,
      alpha: 1.0
    };
    var alpha;
    var previousAlpha;

    for (i = 1; i < saberTrayectory.length; i++) {
      if (i === 1) { previousAlpha = alpha; }
      alpha = 1.0 - ((saberTrayectory.length - i) / saberTrayectory.length);

      currentPoint = saberTrayectory[i];
      previousPoint = saberTrayectory[i-1];

      vertices[36 * i] = previousPoint.center.x;
      vertices[36 * i + 1] = previousPoint.center.y;
      vertices[36 * i + 2] = previousPoint.center.z;

      // Color
      colors[48 * i] = color.red;
      colors[48 * i + 1] = color.green;
      colors[48 * i + 2] = color.blue;
      colors[48 * i + 3] = previousAlpha * 0.2;

      vertices[36 * i + 3] = currentPoint.top.x;
      vertices[36 * i + 4] = currentPoint.top.y;
      vertices[36 * i + 5] = currentPoint.top.z;

      // Color
      colors[48 * i + 4] = color.red;
      colors[48 * i + 5] = color.green;
      colors[48 * i + 6] = color.blue;
      colors[48 * i + 7] = alpha;

      vertices[36 * i + 6] = previousPoint.top.x;
      vertices[36 * i + 7] = previousPoint.top.y;
      vertices[36 * i + 8] = previousPoint.top.z;

      // Color
      colors[48 * i + 8] = color.red;
      colors[48 * i + 9] = color.green;
      colors[48 * i + 10] = color.blue;
      colors[48 * i + 11] = previousAlpha;

      vertices[36 * i + 9] = previousPoint.center.x;
      vertices[36 * i + 10] = previousPoint.center.y;
      vertices[36 * i + 11] = previousPoint.center.z;

      // Color
      colors[48 * i + 12] = color.red;
      colors[48 * i + 13] = color.green;
      colors[48 * i + 14] = color.blue;
      colors[48 * i + 15] = previousAlpha * 0.2;

      vertices[36 * i + 12] = currentPoint.center.x;
      vertices[36 * i + 13] = currentPoint.center.y;
      vertices[36 * i + 14] = currentPoint.center.z;

      // Color
      colors[48 * i + 16] = color.red;
      colors[48 * i + 17] = color.green;
      colors[48 * i + 18] = color.blue;
      colors[48 * i + 19] = alpha * 0.2;

      vertices[36 * i + 15] = currentPoint.top.x;
      vertices[36 * i + 16] = currentPoint.top.y;
      vertices[36 * i + 17] = currentPoint.top.z;

      // Color
      colors[48 * i + 20] = color.red;
      colors[48 * i + 21] = color.green;
      colors[48 * i + 22] = color.blue;
      colors[48 * i + 23] = alpha;

      vertices[36 * i + 18] = previousPoint.bottom.x;
      vertices[36 * i + 19] = previousPoint.bottom.y;
      vertices[36 * i + 20] = previousPoint.bottom.z;

      // Color
      colors[48 * i + 24] = color.red;
      colors[48 * i + 25] = color.green;
      colors[48 * i + 26] = color.blue;
      colors[48 * i + 27] = 0.0;

      vertices[36 * i + 21] = currentPoint.center.x;
      vertices[36 * i + 22] = currentPoint.center.y;
      vertices[36 * i + 23] = currentPoint.center.z;

      // Color
      colors[48 * i + 28] = color.red;
      colors[48 * i + 29] = color.green;
      colors[48 * i + 30] = color.blue;
      colors[48 * i + 31] = alpha * 0.2;

      vertices[36 * i + 24] = previousPoint.center.x;
      vertices[36 * i + 25] = previousPoint.center.y;
      vertices[36 * i + 26] = previousPoint.center.z;

      // Color
      colors[48 * i + 32] = color.red;
      colors[48 * i + 33] = color.green;
      colors[48 * i + 34] = color.blue;
      colors[48 * i + 35] = previousAlpha * 0.2;

      vertices[36 * i + 27] = previousPoint.bottom.x;
      vertices[36 * i + 28] = previousPoint.bottom.y;
      vertices[36 * i + 29] = previousPoint.bottom.z;

      // Color
      colors[48 * i + 36] = color.red;
      colors[48 * i + 37] = color.green;
      colors[48 * i + 38] = color.blue;
      colors[48 * i + 39] = 0.0;

      vertices[36 * i + 30] = currentPoint.bottom.x;
      vertices[36 * i + 31] = currentPoint.bottom.y;
      vertices[36 * i + 32] = currentPoint.bottom.z;

      // Color
      colors[48 * i + 40] = color.red;
      colors[48 *    i + 41] = color.green;
      colors[48 * i + 42] = color.blue;
      colors[48 * i + 43] = 0.0;

      vertices[36 * i + 33] = currentPoint.center.x;
      vertices[36 * i + 34] = currentPoint.center.y;
      vertices[36 * i + 35] = currentPoint.center.z;

      // Color
      colors[48 * i + 44] = color.red;
      colors[48 * i + 45] = color.green;
      colors[48 * i + 46] = color.blue;
      colors[48 * i + 47] = alpha * 0.2;

      previousAlpha = alpha;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.vertexColor.needsUpdate = true;
  },

  tick: function (time, delta) {
    //this.initGeometry();
    this.sampleSaberPosition();
  },

  sampleSaberPosition: function () {
    var top = new THREE.Vector3(0, -0.4, 0);
    var center = new THREE.Vector3(0, 0, 0);
    var bottom = new THREE.Vector3(0, 0.4, 0);
    var saberEl = document.getElementById('rightSaber').components['saber-controls'].saberEl;
    var saberObject;

    if (!saberEl) { return; }

    saberObject = saberEl.object3D;

    saberObject.parent.updateMatrixWorld();
    saberObject.localToWorld(top);
    saberObject.localToWorld(center);
    saberObject.localToWorld(bottom);

    if (this.saberTrayectory.length === this.maxPoints) {
      this.saberTrayectory.shift();
    }

    this.saberTrayectory.push({
      top: top,
      center: center,
      bottom: bottom
    });

    this.initGeometry();
  }
});