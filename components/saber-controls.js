AFRAME.registerComponent('saber-controls', {
  schema: {
    hand: {default: 'left', oneOf: ['left', 'right']}
  },

  init: function () {
    var el = this.el;
    var data = this.data;
    el.setAttribute('oculus-touch-controls', {hand: data.hand, model: false});
    el.setAttribute('vive-controls', {hand: data.hand, model: false});
    el.setAttribute('windows-motion-controls', {hand: data.hand, model: false});
    el.addEventListener('controllerconnected', this.initSaber.bind(this));
  },

  initSaber: function () {
    var el = this.el;
    var saberHandleEl = document.createElement('a-entity');
    var saberEl = this.saberEl = document.createElement('a-entity');
    var saberPivotEl = document.createElement('a-entity');
    var saberColor = this.data.hand === 'left' ? '#f9a7c6' : '#98befc';

    this.boundingBox = new THREE.Box3();

    saberEl.setAttribute('material', {shader: 'flat', color: saberColor});
    saberEl.setAttribute('geometry', {primitive: 'cylinder', height: 0.8, radius: 0.015});
    saberEl.setAttribute('position', '0 -0.5 0');

    saberHandleEl.setAttribute('material', {shader: 'flat', color: '#151515'});
    saberHandleEl.setAttribute('geometry', {primitive: 'cylinder', height: 0.2, radius: 0.015});
    saberHandleEl.setAttribute('position', '0 0 0');

    saberPivotEl.setAttribute('rotation', '70 0 0');
    saberPivotEl.appendChild(saberHandleEl);
    saberPivotEl.appendChild(saberEl);
    el.appendChild(saberPivotEl);
  },

  tick: function () {
    if (!this.saberEl) { return; }
    this.boundingBox.setFromObject(this.saberEl.getObject3D('mesh'));
  }

});