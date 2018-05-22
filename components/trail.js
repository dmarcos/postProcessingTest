AFRAME.registerComponent('trail', {
   init: function () {
    var geometry = this.geometry = new THREE.BufferGeometry();
    var vertices = this.vertices = new Float32Array(12 * 3 * 10); 
    var colors = this.colors = [];
    this.initGeometry(0.5, true);
    colors = new Float32Array(colors);   

    //var normals = new Float32Array(this.maxBufferSize * 3);
    //var uvs = new Float32Array(this.maxBufferSize * 2);

    //geometry.setDrawRange(0, 0);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3).setDynamic(true));
    // geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2).setDynamic(true));
    // geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3).setDynamic(true));
    geometry.addAttribute('vertexColor', new THREE.BufferAttribute(colors, 4).setDynamic(true));
    
    var material = new THREE.MeshBasicMaterial({color: 0xffff00, vertexColors: THREE.VertexColors});

    var material = new THREE.ShaderMaterial({
      vertexColors: THREE.VertexColors,
      transparent: true,
      vertexShader: [
        'attribute vec4 vertexColor;',
        'varying vec4 vColor;',
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
    var mesh = this.mesh = new THREE.Mesh(geometry, material);

    // var material = new THREE.MeshBasicMaterial({color: 0xffff00});
    // var wireframe = new THREE.WireframeGeometry(geometry);
    // var mesh = new THREE.LineSegments(wireframe, material);

    mesh.frustumCulled = false;
    mesh.vertices = vertices;
    mesh.scale.set(0.4, 0.4, 0.4);
    mesh.rotation.set(0, 0, Math.PI / 2.0);
    mesh.position.set(-0.25, 0, 0);
    this.el.setObject3D('trail', mesh);
  },

  initGeometry: function (length, initColors) {
    var startX = -1.0;
    var segments = 10;
    var dx = 2 / segments;
    var colors = this.colors;

    var vertices = this.vertices;
    for (var i = 0; i < segments; ++i) {
      vertices[12 * 3 * i] = startX + i * dx;
      vertices[12 * 3 * i + 1] = 0.0;
      vertices[12 * 3 * i + 2] = 0.0;
      vertices[12 * 3 * i + 3] = startX + i * dx;
      vertices[12 * 3 * i + 4] = length;
      vertices[12 * 3 * i + 5] = 0.0;
      vertices[12 * 3 * i + 6] = startX + i * dx + dx;
      vertices[12 * 3 * i + 7] = length;
      vertices[12 * 3 * i + 8] = 0.0;

      vertices[12 * 3 * i + 9] = startX + i * dx + dx;
      vertices[12 * 3 * i + 10] = 0.0;
      vertices[12 * 3 * i + 11] = 0.0;
      vertices[12 * 3 * i + 12] = startX + i * dx;
      vertices[12 * 3 * i + 13] = 0.0;
      vertices[12 * 3 * i + 14] = 0.0;
      vertices[12 * 3 * i + 15] = startX + i * dx + dx;
      vertices[12 * 3 * i + 16] = length;
      vertices[12 * 3 * i + 17] = 0.0;

      vertices[12 * 3 * i + 18] = startX + i * dx + dx;
      vertices[12 * 3 * i + 19] = -length;
      vertices[12 * 3 * i + 20] = 0.0;
      vertices[12 * 3 * i + 21] = startX + i * dx;
      vertices[12 * 3 * i + 22] = -length;
      vertices[12 * 3 * i + 23] = 0.0;
      vertices[12 * 3 * i + 24] = startX + i * dx;
      vertices[12 * 3 * i + 25] = 0.0;
      vertices[12 * 3 * i + 26] = 0.0;

      vertices[12 * 3 * i + 27] = startX + i * dx + dx;
      vertices[12 * 3 * i + 28] = -length;
      vertices[12 * 3 * i + 29] = 0.0;
      vertices[12 * 3 * i + 30] = startX + i * dx;
      vertices[12 * 3 * i + 31] = 0.0;
      vertices[12 * 3 * i + 32] = 0.0;
      vertices[12 * 3 * i + 33] = startX + i * dx + dx;
      vertices[12 * 3 * i + 34] = 0.0;
      vertices[12 * 3 * i + 35] = 0.0;

      if (initColors) {
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);

        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
        this.pushColor(colors);
      }
    }
  },

  pushColor: function (colors) {
    colors.push(1.0); colors.push(1.0); colors.push(0.0); colors.push(0.5);
  },

  tick: function (time, delta) {
    if (this.trailStarted) {
      this.timeElapsed += delta;
      if (this.timeElapsed >= 50) { 
        this.trailStarted = false;
        this.finalVector = this.getSaberPosition();
        this.distanceStroke = this.finalVector.distanceTo(this.startVector);
        this.initGeometry(this.distanceStroke * 2);
        //this.el.object3D.worldToLocal(this.finalVector);
        //this.el.object3D.worldToLocal(this.startVector);
        var direction = new THREE.Vector3().copy(this.startVector).sub(this.finalVector);
        var angle = new THREE.Vector3(0, 1, 0).angleTo(direction);
        this.geometry.attributes.position.needsUpdate = true;
        if (direction.x < 0) {
          this.mesh.position.set(-this.distanceStroke, 0, 0);
        } else {
          this.mesh.position.set(this.distanceStroke, 0, 0);
        }
        this.el.object3D.rotation.set(0, Math.atan(direction.y / direction.x), 0);

      } 
    } else {
      var vector = new THREE.Vector3();
      this.el.object3D.parent.updateMatrixWorld();
      vector.setFromMatrixPosition(this.el.object3D.matrixWorld);
      this.startVector = this.getSaberPosition();
      this.trailStarted = true;
      this.timeElapsed = 0;
    }
  },

  getSaberPosition: function () {
    var vector = new THREE.Vector3();
    this.el.object3D.parent.updateMatrixWorld();
    vector.setFromMatrixPosition(this.el.object3D.matrixWorld);
    return vector;
  }
});