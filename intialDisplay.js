(function () {

    let text = "Translation will appear here";
    let textOptions = [
      "Translation will appear here.",
      "Translation will appear here.",
      "La traduction apparaîtra ici.",
      "La traducción aparecerá aquí.",
      "A tradução aparecerá aqui.",
      "ستظهر الترجمة هنا.",
      "翻訳はここに表示されます。",
      "Перевод появится здесь.",
      "Die Übersetzung wird hier erscheinen.",
      "译文将显示在此处。",
      "번역이 여기에 표시됩니다.",
      "अनुवाद यहाँ दिखाई देगा।",
      "De vertaling verschijnt hier.",
      "vertaling sal hier verskyn.",
    ];
    let copies = [];
    let i = 0;
    let instance = null;
    let containerEl = null;
    const background = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--lightmode-background");



    function ensure() {
      containerEl = document.getElementById("initial-display");
      if (!containerEl) return null;
      if (containerEl.getAttribute("status") === "closed"){
        return null;
      }

        if (instance) {
          if (!containerEl.contains(instance.canvas)) {
            instance = null;
          } else {
            return instance;
          }
        }

      containerEl.innerHTML = "";

      instance = new p5((p) => {
        p.setup = () => {
          const w = containerEl.clientWidth;
          p.createCanvas(w, containerEl.clientHeight);
          p.pixelDensity(2);
          p.frameRate(2);
          p.noLoop();
          p.background(background);
          setInterval(() => {
            copies.push({
              str: p.random(textOptions),
              x: p.random(-100, p.width),
              y: p.random(-25, p.height),
              size: p.random(12, 24),
            });
            p.redraw();
          }, 1200);
        };

        p.draw = () => {
          p.background(background);
          const availableWidth = containerEl.clientWidth;

          p.resizeCanvas(availableWidth, containerEl.clientHeight);
          

          for (const c of copies) {
            p.textSize(c.size);
            p.fill(0, 0, 0, 50);
            p.text(c.str, c.x, c.y);
          }

        };
      }, containerEl);

      window.addEventListener("resize", () => {
        if (!instance || !containerEl) return;
        instance.resizeCanvas(
          containerEl.clientWidth,
          containerEl.clientHeight
        );
        instance.redraw();
      });

      return instance;
    }

    ensure();



})();