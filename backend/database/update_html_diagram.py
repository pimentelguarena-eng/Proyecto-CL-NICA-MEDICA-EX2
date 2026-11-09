import re

svg_path = "/home/andrez/Documentos/SI/MedicalProyect/Medical/clinica_medical_erd.svg"
html_path = "/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/database/database_diagram.html"

with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

# Make the svg responsive with id
svg_inline = svg_content.replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg id="erdSvg" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto transition-transform duration-200 origin-top-left"')

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Add download and export toolbar after header controls
toolbar_html = '''
      <!-- Action & Download Buttons -->
      <div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Descargar Diagrama:</span>
        <button onclick="downloadSvg()" class="flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-sm transition-all cursor-pointer">
          <i class="fa-solid fa-file-arrow-down"></i> Descargar SVG (Vectorial HD)
        </button>
        <button onclick="downloadPng()" class="flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-sm transition-all cursor-pointer">
          <i class="fa-solid fa-image"></i> Descargar PNG (Imagen)
        </button>
        <button onclick="window.print()" class="flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold shadow-sm transition-all cursor-pointer">
          <i class="fa-solid fa-print"></i> Guardar PDF / Imprimir
        </button>
        <div class="ml-auto flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300">
          <button id="btnTabVisual" onclick="switchView('visual')" class="text-xs py-1.5 px-3 rounded-lg font-bold bg-white text-teal-800 shadow-xs transition-all">
            <i class="fa-solid fa-diagram-project mr-1"></i> Vista Gráfica ERD
          </button>
          <button id="btnTabCards" onclick="switchView('cards')" class="text-xs py-1.5 px-3 rounded-lg font-bold text-slate-600 hover:text-slate-900 transition-all">
            <i class="fa-solid fa-table-cells mr-1"></i> Vista Tarjetas Detalladas
          </button>
        </div>
      </div>
'''

# Find header closing
header_target = '<!-- Active Relationship Banner -->'
html = html.replace(header_target, toolbar_html + '\n    ' + header_target)

# Add visual diagram section container before <main id="tablesContainer">
visual_section = f'''
  <!-- Visual Diagram View Tab -->
  <section id="visualDiagramSection" class="max-w-7xl mx-auto mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
      <div>
        <h2 class="text-base font-black text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-network-wired text-teal-600"></i> Diagrama Gráfico de Entidades y Relaciones
        </h2>
        <p class="text-xs text-slate-500 font-medium">17 Tablas con llaves primarias, foráneas, restricciones únicas y líneas de cardinalidad.</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="zoomVisual(0.1)" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold" title="Acercar">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </button>
        <button onclick="zoomVisual(-0.1)" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold" title="Alejar">
          <i class="fa-solid fa-magnifying-glass-minus"></i>
        </button>
        <button onclick="resetZoomVisual()" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold" title="Reiniciar Zoom">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>
    
    <div id="svgScrollWrapper" class="overflow-auto max-h-[800px] border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
      {svg_inline}
    </div>
  </section>
'''

html = html.replace('<main class="max-w-7xl mx-auto space-y-8" id="tablesContainer">', visual_section + '\n  <main class="max-w-7xl mx-auto space-y-8 hidden" id="tablesContainer">')

# Add JS functions before </body>
js_functions = '''
    // Zoom control for Visual ERD
    let currentZoom = 1;
    function zoomVisual(delta) {
      currentZoom = Math.max(0.4, Math.min(2.5, currentZoom + delta));
      const svg = document.getElementById('erdSvg');
      if (svg) svg.style.transform = `scale(${currentZoom})`;
    }

    function resetZoomVisual() {
      currentZoom = 1;
      const svg = document.getElementById('erdSvg');
      if (svg) svg.style.transform = 'scale(1)';
    }

    // Switch between Graphical ERD and Detailed Table Cards
    function switchView(view) {
      const visualSec = document.getElementById('visualDiagramSection');
      const cardsSec = document.getElementById('tablesContainer');
      const btnVisual = document.getElementById('btnTabVisual');
      const btnCards = document.getElementById('btnTabCards');

      if (view === 'visual') {
        visualSec.classList.remove('hidden');
        cardsSec.classList.add('hidden');
        btnVisual.className = "text-xs py-1.5 px-3 rounded-lg font-bold bg-white text-teal-800 shadow-xs transition-all";
        btnCards.className = "text-xs py-1.5 px-3 rounded-lg font-bold text-slate-600 hover:text-slate-900 transition-all";
      } else {
        visualSec.classList.add('hidden');
        cardsSec.classList.remove('hidden');
        btnCards.className = "text-xs py-1.5 px-3 rounded-lg font-bold bg-white text-teal-800 shadow-xs transition-all";
        btnVisual.className = "text-xs py-1.5 px-3 rounded-lg font-bold text-slate-600 hover:text-slate-900 transition-all";
      }
    }

    // Direct Download SVG
    function downloadSvg() {
      const svg = document.getElementById('erdSvg');
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svg);
      
      if (!source.match(/^<svg[^>]+xmlns="http\\:\\/\\/www\\.w3\\.org\\/2000\\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Diagrama_ER_Clinica_Medical.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Direct Download PNG (High Resolution)
    function downloadPng() {
      const svg = document.getElementById('erdSvg');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL_API = window.URL || window.webkitURL || window;
      const blobURL = URL_API.createObjectURL(svgBlob);

      img.onload = function() {
        const canvas = document.createElement('canvas');
        // Render at 2x resolution for super crisp export
        canvas.width = 3500;
        canvas.height = 1960;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function(pngBlob) {
          const pngUrl = URL_API.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'Diagrama_ER_Clinica_Medical.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL_API.revokeObjectURL(pngUrl);
        }, 'image/png');
        URL_API.revokeObjectURL(blobURL);
      };
      img.src = blobURL;
    }
'''

html = html.replace('</script>\n</body>', js_functions + '\n  </script>\n</body>')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Updated database_diagram.html with visual tabs and export functions successfully!")
