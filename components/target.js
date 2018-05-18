AFRAME.registerComponent('target', {
  schema: {
    speed: {default: 5},
    color: {default: 'red', oneOf: ['red', 'blue']},
    debug: {default: false},
    size: {default: 0.5}
  },

  init: function () {
    var el = this.el;
    var redMaterialArrow = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/redTargetArrow.png')});
    var redMaterial = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/redTarget.png')});
    var blueMaterialArrow = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/blueTargetArrow.png')});
    var blueMaterial = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('images/blueTarget.png')});
    var materials = {
      red: [redMaterial, redMaterial, redMaterial, redMaterial, redMaterialArrow, redMaterial],
      blue: [blueMaterial, blueMaterial, blueMaterial, blueMaterial, blueMaterialArrow, blueMaterial]
    };
    var size = this.data.size;
    this.targetCollidersConfiguration = [
      {position: {x: size / 2, y: 0, z: 0}, size: {width: size / 5.0, height: size, depth: size}},
      {position: {x: -size / 2, y: 0, z: 0}, size: {width: size / 5.0, height: size, depth: size}},
      {position: {x: 0, y: size / 2, z: 0}, size: {width: size, height: size / 5.0, depth: size}},
      {position: {x: 0, y: -size / 2, z: 0}, size: {width: size, height: size / 5.0, depth: size}},
      {position: {x: 0, y: 0, z: size / 2}, size: {width: size, height: size, depth: size / 5.0}},
      {position: {x: 0, y: 0, z: -size / 2}, size: {width: size, height: size, depth: size / 5.0}}
    ];
    this.boundingBox = new THREE.Box3();
    this.saberEls = this.el.sceneEl.querySelectorAll('[saber-controls]');
    el.setAttribute('geometry', 'primitive: box; width: 0.5; height: 0.5; depth: 0.5');
    if (this.data.color === 'red') {
      el.getObject3D('mesh').material = materials.red;
    } else {
      el.getObject3D('mesh').material = materials.blue;
    }
    this.initColliders();
    this.initFragments();
  },

  initColliders: function () {
    var targetColliderEl;
    var targetCollidersConfiguration = this.targetCollidersConfiguration;
    var targetCollidersEls = this.targetCollidersEls = [];
    var i;
    for (i = 0; i < 6; i++) {
      targetColliderEl = document.createElement('a-entity');
      targetColliderEl.setAttribute('geometry', 'primitive: box');
      targetColliderEl.setAttribute('position', targetCollidersConfiguration[i].position);
      targetColliderEl.setAttribute('geometry', targetCollidersConfiguration[i].size);
      targetColliderEl.setAttribute('visible', false);
      targetCollidersEls.push(targetColliderEl);
      if (i == 2) { this.correctTargetColliderEl = targetColliderEl; }
      this.el.appendChild(targetColliderEl);
      if (this.data.debug) {
        targetColliderEl.setAttribute('visible', true);
        if (i == 2) { 
          targetColliderEl.setAttribute('material', 'color: yellow');
        } else {
          targetColliderEl.setAttribute('material', 'color: purple');
        }
      }
    }
  },

  initFragments: function () {
    var partEl;
    var color = this.data.color === 'red' ? '#5b0502' : '#083771';
    var size = this.data.size;
    var geometry = {primitive: 'box', height: size, width: size / 2, depth: size};
    
    partEl = this.partLeftEl = document.createElement('a-entity');
    partEl.setAttribute('geometry', geometry);
    partEl.setAttribute('material', {color: color});
    partEl.setAttribute('visible', false);

    this.el.appendChild(partEl);

    partEl = this.partRightEl = document.createElement('a-entity');
    partEl.setAttribute('geometry', geometry);
    partEl.setAttribute('material', {color: color});
    partEl.setAttribute('visible', false);

    this.el.appendChild(partEl);
  },

  destroyTarget: function () {
    var i;
    this.el.getObject3D('mesh').visible = false;
    for (i = 0; i < 6; i++) {
      this.targetCollidersEls[i].setAttribute('visible', false);
    }
    this.partLeftEl.setAttribute('visible', true);
    this.partRightEl.setAttribute('visible', true);
    this.destroyed = true;
  },

  tock: function (time, timeDelta) {
    var i;
    var saberEls = this.saberEls;
    var boundingBox;
    var saberBoundingBox;

    if (!this.destroyed) {
      boundingBox = this.boundingBox.setFromObject(this.correctTargetColliderEl.getObject3D('mesh'));
      for (i = 0; i < saberEls.length; i++) {
        saberBoundingBox = saberEls[i].components['saber-controls'].boundingBox;
        if (boundingBox && saberBoundingBox && saberBoundingBox.intersectsBox(boundingBox)) {
          this.destroyTarget();
          break;
        }
      }
      this.el.object3D.position.z += this.data.speed * (timeDelta / 1000);
    } else {
      this.partLeftEl.object3D.position.x -= this.data.speed * (timeDelta / 1000);
      this.partRightEl.object3D.position.x += this.data.speed * (timeDelta / 1000);
    }
  }
});