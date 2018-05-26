AFRAME.registerSystem("glow", {
    init: function () {
      this.renderTarget = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
      this.renderTarget.texture.generateMipmaps = false;
      this.renderTarget.depthBuffer = true;
      this.renderTarget.depthTexture = new THREE.DepthTexture();
      this.renderTarget.depthTexture.type = THREE.UnsignedShortType;
      this.renderTarget.depthTexture.minFilter = THREE.LinearFilter;
      this.renderTarget.stencilBuffer = false;

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
      this.quad.frustumCulled = false;
      this.scene.add(this.quad);
      this.sceneLeft = new THREE.Scene();
      this.quadLeft = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
      this.quadLeft.geometry.attributes.uv.array.set([0, 1, 0.5, 1, 0, 0, 0.5, 0]);
      this.quadLeft.frustumCulled = false;
      this.sceneLeft.add(this.quadLeft);
      this.sceneRight = new THREE.Scene();
      this.quadRight = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
      this.quadRight.geometry.attributes.uv.array.set([0.5, 1, 1, 1, 0.5, 0, 1, 0]);
      this.quadRight.frustumCulled = false;
      this.sceneRight.add(this.quadRight);
      this.targets = [
        new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }),
        new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })
      ];

      this.tDiffuse = {type: "t", value: null};
      this.tDepth = {type: "t", value: this.renderTarget.depthTexture};
      this.cameraFar = {type: "f", value: 0};
      this.cameraNear = {type: "f", value: 0};
      this.time = { type: "f", value: 0 };
      this.timeDelta = { type: "f", value: 0 };
      this.uvClamp = { type: "v2", value: this.uvBoth };
      this.resolution = { type: "v4", value: new THREE.Vector4() };

      var fs = [
        "uniform vec2 uvClamp;",
        "vec4 textureVR( sampler2D sampler, vec2 uv ) {",
        " return texture2D(sampler, vec2(clamp(uv.x, uvClamp.x, uvClamp.y), uv.y));",
        "} "
      ].join("\n");

      var vs = [
        '#include <common>',
        'varying vec2 vUv;',
        'void main() {',
        '   vUv = uv;',
        '   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n');

      var uniforms = {
        time: this.time,
        timeDelta: this.timeDelta,
        resolution: this.resolution
      };

      var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NoBlending,
        fog: false,
        extensions: {
            derivatives: true
        },
        defines: {}
      });

      this.sceneEl.renderTarget = this.renderTarget;
    },

    uvLeft: new THREE.Vector2(0, 0.5),
    uvRight: new THREE.Vector2(0.5, 1),
    uvBoth: new THREE.Vector2(0, 1),

    renderPass: function (material, renderTarget, viewCb, forceClear){
        var renderer = this.sceneEl.renderer;
        this.quad.material = material;
        var isFn = typeof viewCb === "function";
        var s = renderTarget || renderer.getSize();
        this.resolution.value.set(s.width, s.height, 1/s.width, 1/s.height);
        var oldClear = renderer.autoClear;
        renderer.autoClear = false;
        if (viewCb) {
            if (this.cameras.length > 1){
                this.quadLeft.material = material;
                this.uvClamp.value = this.uvLeft;
                setView(0, 0, Math.round(s.width * 0.5), s.height);
                if (isFn) viewCb(material, this.cameras[0], -1);
                renderer.render(this.sceneLeft, this.camera, renderTarget, oldClear || forceClear);        
                
                this.quadRight.material = material;
                this.uvClamp.value = this.uvRight;
                setView(Math.round(s.width * 0.5), 0, Math.round(s.width * 0.5), s.height);
                if (isFn) viewCb(material, this.cameras[1], 1);
                renderer.render( this.sceneRight, this.camera, renderTarget);

                this.uvClamp.value = this.uvBoth;
                setView(0, 0, s.width, s.height);
            } else {
                setView(0, 0, s.width, s.height);
                if (isFn) viewCb(material, this.sceneEl.camera, 0);
                renderer.render( this.scene, this.camera, renderTarget, oldClear || forceClear);
            }
        } else {
            setView(0, 0, s.width, s.height);
            renderer.render(this.scene, this.camera, renderTarget, oldClear || forceClear);
        }
        renderer.autoClear = oldClear;
        function setView(x,y,w,h) {
            if (renderTarget) {
                renderTarget.viewport.set( x, y, w, h );
                renderTarget.scissor.set( x, y, w, h );
            } else {
                renderer.setViewport( x, y, w, h );
                renderer.setScissor( x, y, w, h );
            }
        }
    },

    tick: function (time, timeDelta) {
        var self = this, sceneEl = this.sceneEl, renderer = sceneEl.renderer, effect = sceneEl.effect, 
            rt = this.renderTarget, rts = this.targets;
        if(!rt || !renderer) { return; }
        if (this.needsOverride) {
            if(renderer.onBeforeRender) {
                renderer.onBeforeRender = function (renderer, scene, camera) {
                    var size = renderer.getSize();
                    if (size.width !== rt.width || size.height !== rt.height) {
                        rt.setSize(size.width, size.height);
                        rts[0].setSize(size.width, size.height);
                        rts[1].setSize(size.width, size.height);
                        self.resolution.value.set(size.width, size.height, 1/size.width, 1/size.height);
                        self.needsResize = true;
                    }
                    if(camera instanceof THREE.ArrayCamera) {
                        self.cameras = camera.cameras;
                    } else {
                        self.cameras.push(camera);
                    }
                }
            } else {
                var rendererRender = renderer.render;
                renderer.render = function (scene, camera, renderTarget, forceClear) {
                    if (renderTarget === rt) {
                        var size = renderer.getSize();
                        if (size.width !== rt.width || size.height !== rt.height) {
                            rt.setSize(size.width, size.height);
                            rts[0].setSize(size.width, size.height);
                            rts[1].setSize(size.width, size.height);
                            self.resolution.value.set(size.width, size.height, 1/size.width, 1/size.height);
                            self.needsResize = true;
                        }
                        self.cameras.push(camera);
                    }
                    rendererRender.call(renderer, scene, camera, renderTarget, forceClear);
                }
            }        
            this.needsOverride = false;
        }
        this.cameras = [];
        this.time.value = time / 1000;
        this.timeDelta.value = timeDelta / 1000;

        if (this.needsUpdate === true) { this.rebuild(); }

        this.tDiffuse.value = this.renderTarget.texture;
        this.tDepth.value = this.renderTarget.depthTexture;
        var camera = this.sceneEl.camera;
        this.cameraFar.value = camera.far;
        this.cameraNear.value = camera.near;                
    },

    tock: function () {
        var sceneEl = this.sceneEl; 
        var renderer = sceneEl.renderer;
        if (this.runningTock) {
          this.runningTock = false;
          return;
        }
        this.runningTock = true;
        renderer.render(this.el.object3D, this.el.camera);
    }
});
