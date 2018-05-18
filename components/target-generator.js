AFRAME.registerComponent('target-generator', {
  init: function () {
    this.el.sceneEl.addEventListener('loaded', this.initTargets.bind(this));
    this.orientations = {
      left: [0, 180, 270],
      right: [0, 90, 180]
    };
  },

  initTargets: function () {
    var i;
    var el;
    var x;
    var z = -30;
    var color;
    var orientations;
    for (i = 0; i < 20; ++i) {
      el = this.el.sceneEl.components.pool__target.requestEntity();
      if (i % 2 === 0) {
        x = Math.random() < 0.5 ? 0.3 : 0.6;
        color = "blue";
        orientations = this.orientations.right;
      } else {
        x = Math.random() < 0.5 ? -0.3 : -0.6;
        color = "red";
        orientations = this.orientations.left;
      }
      z -= 3;
      el.setAttribute('target', {color: color});
      el.setAttribute('position', {
        x: x,
        y: 1.0,
        z: z
      });
      el.setAttribute('rotation', {x: 0, y: 0, z: orientations[Math.floor(Math.random()*3)]});
    }
  }

});