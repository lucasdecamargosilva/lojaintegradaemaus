(function () {
    console.log('[Provador] Script carregado');

    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/quantic-materialize';

    const SIZES_TOP = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];
    const SIZES_BOTTOM = ['36/XXP', '38/XP', '40/P', '42/M', '44/G', '46/XG', '48/XXG', '50/3XG', '52/4XG', '54/5XG'];
    const SIZES_BOTTOM_SW = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];

    const GRADE = {
        regular: [49, 51, 54, 57, 61, 62, 64, 66, 70, 73],
        oversized: [58, 60, 62, 64, 66, 70, 73, 76, 79, 83],
        oversizedSS: [58, 61, 63, 67, 70, 74, 78, 82, 87, 92],
        hoodie: [50, 53, 55, 58, 62, 65, 69, 74, 79, 83],
        boxyHoodie: [61, 77, 78, 79, 80, 81, 82, 83, 84, 85],
        puffer: [53, 56, 59, 61, 70, 74, 78, 82, 86, 90],
        vest: [52, 55, 57, 59, 63, 66, 70, 72, 76, 82],
        boxyHenley: [54, 56, 58, 64, 66, 68, 70, 76, 78, 84],
        bottomTailoring: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        bottomSweat: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        underwear: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        quadrilTailoring: [48, 50, 52, 56, 58, 60, 62, 64, 66, 68],
        quadrilSweat: [48, 50, 52, 54, 56, 58, 60, 62, 64, 66],
        quadrilUnderwear: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68],
    };

    function detectProduct(name) {
        const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (/tailoring/.test(n) || /\d\/\d\s*short/.test(n) || /\b(1\/5|2\/5|3\/5|4\/5)\b/.test(n)) return { category: 'bottom', fit: 'tailoring' };
        if (/underwear|cueca/.test(n)) return { category: 'bottom', fit: 'underwear' };
        if (/sweatpant|sweatshort|sweat pant|sweat short|calca|bermuda/.test(n)) return { category: 'bottom', fit: 'sweat' };
        if (/henley/.test(n)) return { category: 'top', fit: 'boxyHenley' };
        if (/boxy.*(hoodie|crewneck|crew)/.test(n) || /(hoodie|crewneck|crew).*boxy/.test(n)) return { category: 'top', fit: 'boxyHoodie' };
        if (/puffer|jacket/.test(n)) return { category: 'top', fit: 'puffer' };
        if (/vest/.test(n)) return { category: 'top', fit: 'vest' };
        if (/(hoodie|hoodie zip|half zip|crewneck|crew neck)/.test(n) && !/oversized|boxy|short sleeve/.test(n)) return { category: 'top', fit: 'hoodie' };
        if (/oversized.*(hoodie|crewneck|crew|short sleeve)/.test(n) || /short sleeve.*(hoodie|crewneck)/.test(n)) return { category: 'top', fit: 'oversizedSS' };
        if (/oversized|boxy tee|2\/4/.test(n)) return { category: 'top', fit: 'oversized' };
        return { category: 'top', fit: 'regular' };
    }

    function estimarTorax(altura, peso) {
        if (altura < 3) altura *= 100;
        let circ = 0.65 * peso + 56;
        const imc = peso / Math.pow(altura / 100, 2);
        if (imc > 30) circ += 4; else if (imc > 25) circ += 2;
        return circ;
    }

    function findClosest(arr, val) {
        let idx = 0, minDiff = Infinity;
        arr.forEach((v, i) => { const d = Math.abs(v - val); if (d < minDiff) { minDiff = d; idx = i; } });
        return idx;
    }

    let recommendedSize = 'M';
    let currentProduct = { category: 'top', fit: 'regular' };

    function calcTop(fit) {
        const altura = parseFloat(document.getElementById('q-h-val').value);
        const peso = parseFloat(document.getElementById('q-w-val').value);
        if (!altura || !peso) return;
        const torax = estimarTorax(altura, peso);
        const folga = { regular: 4, oversized: 8, oversizedSS: 8, hoodie: 6, boxyHoodie: 12, puffer: 10, vest: 5, boxyHenley: 9 };
        const larguraAlvo = torax / 2 + (folga[fit] || 4);
        recommendedSize = SIZES_TOP[findClosest(GRADE[fit], larguraAlvo)];
    }

    function calcBottom(fit) {
        const cintura = parseFloat(document.getElementById('q-cin-val').value);
        const quadril = parseFloat(document.getElementById('q-quad-val').value);
        if (!cintura || !quadril) return;
        let gradeC, gradeQ, sizes;
        if (fit === 'tailoring') { gradeC = GRADE.bottomTailoring; gradeQ = GRADE.quadrilTailoring; sizes = SIZES_BOTTOM; }
        else if (fit === 'underwear') { gradeC = GRADE.underwear; gradeQ = GRADE.quadrilUnderwear; sizes = SIZES_BOTTOM_SW; }
        else { gradeC = GRADE.bottomSweat; gradeQ = GRADE.quadrilSweat; sizes = SIZES_BOTTOM_SW; }
        recommendedSize = sizes[Math.max(findClosest(gradeC, cintura / 2), findClosest(gradeQ, quadril / 2))];
    }

    function calculateFinalSize() {
        if (currentProduct.category === 'top') calcTop(currentProduct.fit);
        else calcBottom(currentProduct.fit);
    }

    const styles = `
        :root { --q-primary:#000000;--q-bg:#ffffff;--q-border:#000000;--q-gray:#f5f5f5;--q-text:#000000;--q-text-light:#666666; }
        .q-btn-trigger-ia { display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:8px;background:var(--q-bg);color:var(--q-text);border:1px solid var(--q-border);padding:0 24px !important;height:36px !important;min-height:36px !important;font-family:'Inter',sans-serif;font-weight:700;font-size:10px;letter-spacing:1.5px;cursor:pointer;text-transform:uppercase;transition:0.3s ease;white-space:nowrap;margin-top:-5px !important;margin-bottom:10px;box-sizing:border-box;line-height:36px !important;flex-shrink:0;align-self:flex-start;overflow:hidden; }
        @media(max-width:767px){ .q-btn-trigger-ia { margin-top:-15px !important; padding:0 16px !important; height:32px !important; min-height:32px !important; line-height:32px !important; font-size:9px; margin-bottom:10px; } }
        .q-btn-trigger-ia:hover { background:var(--q-primary);color:var(--q-bg); }
        #q-modal-ia { display:none;position:fixed;inset:0;background:rgba(255,255,255,0.98);z-index:999999;align-items:center;justify-content:center;font-family:'Inter',sans-serif; }
        .q-card-ia { background:var(--q-bg);width:100%;max-width:480px;padding:0;position:relative;color:var(--q-text);border:1px solid var(--q-border);max-height:94vh;display:flex;flex-direction:column;overflow:hidden; }
        .q-content-scroll { padding:40px 30px;overflow-y:auto;flex:1;text-align:center; }
        .q-close-ia { position:absolute;top:20px;right:20px;background:none;border:none;color:var(--q-text);cursor:pointer;font-size:24px;z-index:100;font-weight:300; }
        .q-tips-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:20px 0;margin:20px 0;border-top:1px solid var(--q-gray);border-bottom:1px solid var(--q-gray); }
        .q-tip-item { display:flex;flex-direction:column;align-items:center;gap:8px;font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--q-text-light); }
        .q-tip-item i { color:var(--q-primary);font-size:20px; }
        .q-lead-form { margin:30px 0 20px;display:flex;flex-direction:column;gap:20px;text-align:left; }
        .q-input-row { display:flex;gap:15px; }
        .q-group { flex:1; }
        .q-group label { display:block;font-size:10px;font-weight:800;letter-spacing:2px;color:#000;margin-bottom:12px;text-transform:uppercase; }
        .q-input { width:100%;padding:18px 0;border:none;border-bottom:1px solid #e5e5e5;font-size:15px;font-weight:500;font-family:'Inter',sans-serif;background:transparent;color:#000;outline:none;box-sizing:border-box;border-radius:0;transition:0.3s; }
        .q-input:focus { border-bottom-color:#000;border-bottom-width:2px; }
        .q-input::placeholder { color:#ccc;font-weight:400; }
        .q-input-hint { font-size:9px;color:var(--q-text-light);letter-spacing:0.5px;margin-top:8px;text-transform:uppercase;font-weight:500; }
        .q-btn-black { background:var(--q-primary);color:var(--q-bg);border:1px solid var(--q-primary);width:100%;padding:18px;font-family:'Inter',sans-serif;font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;margin-top:20px;transition:0.3s; }
        .q-btn-black:disabled { background:var(--q-gray);color:#999;border-color:var(--q-gray);cursor:not-allowed; }
        .q-btn-black:not(:disabled):hover { background:var(--q-bg);color:var(--q-primary); }
        .q-btn-buy { background:var(--q-primary);color:var(--q-bg);border:1px solid var(--q-primary);width:100%;padding:20px;font-family:'Inter',sans-serif;font-weight:600;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;margin-bottom:15px;transition:0.3s; }
        .q-btn-buy:hover { background:var(--q-bg);color:var(--q-primary); }
        .q-btn-outline { background:var(--q-bg);color:var(--q-primary);border:1px solid var(--q-border);width:100%;padding:18px;font-family:'Inter',sans-serif;font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:0.3s; }
        .q-btn-outline:hover { background:var(--q-primary);color:var(--q-bg); }
        .q-powered-footer { background:var(--q-bg);padding:20px;display:flex;align-items:center;justify-content:center;gap:10px;flex-shrink:0;border-top:1px solid var(--q-gray); }
        .q-quantic-logo { height:18px; filter: brightness(0); }
        .q-status-msg { display:none;font-size:9px;letter-spacing:1px;color:#ef4444;margin-top:8px;font-weight:600;text-align:left;text-transform:uppercase; }
        @keyframes q-slide { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes q-pulse-text { 0%,100%{opacity:0.4;transform:scale(0.98)} 50%{opacity:1;transform:scale(1)} }
        .q-content-scroll::-webkit-scrollbar { width:4px; }
        .q-content-scroll::-webkit-scrollbar-thumb { background:#e5e5e5; }
        @media(min-width:768px){
            .q-card-ia.is-result{width:820px!important;max-width:90vw!important;height:560px!important;border-radius:0!important}
            .q-card-ia.is-result #q-header-provador,.q-card-ia.is-result .q-powered-footer{display:none!important}
            .q-card-ia.is-result .q-content-scroll{padding:0!important;height:100%!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}
            .q-card-ia.is-result #q-step-result{display:flex!important;flex-direction:row!important;width:100%;height:100%;align-items:stretch}
            .q-card-ia.is-result #q-result-img-col{width:45%!important;height:100%!important;margin:0!important;border:none!important;border-right:1px solid var(--q-border)!important;position:relative!important;flex-shrink:0}
            .q-card-ia.is-result #q-result-img-col img{position:absolute!important;top:0;left:0;width:100%!important;height:100%!important;object-fit:cover!important;object-position:top center!important}
            .q-card-ia.is-result #q-result-actions-col{width:55%!important;height:100%!important;padding:40px!important;display:flex!important;flex-direction:column;justify-content:center;box-sizing:border-box;overflow-y:auto}
            .q-card-ia.is-result .q-res-title{display:block!important;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--q-text);margin-bottom:4px}
            .q-card-ia.is-result .q-res-subtitle{display:block!important;font-size:11px;color:var(--q-text-light);letter-spacing:1px;text-transform:uppercase;margin-bottom:30px}
            .q-card-ia.is-result .q-metrics-row{display:flex!important;gap:15px;margin-bottom:30px}
            .q-card-ia.is-result .q-metric-card{flex:1;background:transparent;border:1px solid var(--q-border);border-radius:0;padding:16px}
            .q-card-ia.is-result .q-metric-label{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--q-text-light);margin-bottom:6px;display:block}
            .q-card-ia.is-result .q-metric-value{font-size:20px;font-weight:700;color:var(--q-text)}
            .q-card-ia.is-result .q-metric-unit{font-size:12px;color:var(--q-text-light);margin-left:2px}
            .q-card-ia.is-result .q-size-card{display:flex!important;align-items:center;gap:16px;background:var(--q-gray);border:1px solid var(--q-border);border-radius:0;padding:20px;margin-bottom:24px}
            .q-card-ia.is-result .q-size-circle{width:44px;height:44px;border-radius:50%;background:var(--q-primary);color:var(--q-bg);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0}
            .q-card-ia.is-result .q-size-info{flex:1}
            .q-card-ia.is-result .q-size-info strong{display:block;font-size:11px;font-weight:600;color:var(--q-text);margin-bottom:4px;letter-spacing:1.5px;text-transform:uppercase}
            .q-card-ia.is-result .q-size-info span{font-size:9px;color:var(--q-text-light);letter-spacing:1px;text-transform:uppercase;display:block}
            .q-card-ia.is-result .q-size-check{color:var(--q-primary);font-size:24px;flex-shrink:0}
            .q-card-ia.is-result .q-res-note{display:flex!important;align-items:flex-start;gap:8px;font-size:10px;color:var(--q-text-light);font-style:italic;letter-spacing:1px;margin-bottom:24px;line-height:1.5}
            .q-card-ia.is-result .q-res-note i{flex-shrink:0;margin-top:1px;font-size:14px}
            .q-card-ia.is-result .q-btn-buy{border-radius:0!important;display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px!important;padding:18px!important;margin-bottom:12px;font-weight:600;letter-spacing:2px!important;text-transform:uppercase!important}
            .q-card-ia.is-result .q-btn-outline{border-radius:0!important;display:flex;align-items:center;justify-content:center;font-size:11px!important;padding:18px!important;margin-top:0;font-weight:600;letter-spacing:2px!important;text-transform:uppercase!important}
            .q-card-ia.is-result .q-res-mobile-only{display:none!important}
            .q-card-ia.is-result .q-close-ia{top:16px;right:16px;color:var(--q-text);z-index:10}
        }
    `;

    const html = `
        <div id="q-modal-ia">
            <div class="q-card-ia">
                <button type="button" class="q-close-ia" id="q-close-btn">&times;</button>
                <div class="q-content-scroll">
                    <div id="q-header-provador" style="border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:30px;display:flex;flex-direction:column;align-items:center;">
                        <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-1px;text-transform:lowercase;font-family:'Inter',sans-serif;color:#000;line-height:1;">emaus<span style="color:var(--q-primary);position:relative;top:-5px;font-size:20px;">*</span></h1>
                        <p style="margin:5px 0 0;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#000;opacity:0.5;">Provador Virtual</p>
                    </div>
                    <div id="q-step-upload">
                        <div class="q-lead-form">
                            <div class="q-group">
                                <label>Seu WhatsApp</label>
                                <input type="tel" id="q-phone" class="q-input" placeholder="(11) 99999-9999" maxlength="15">
                                <div id="q-phone-error" class="q-status-msg">Insira um n\u00FAmero v\u00E1lido</div>
                            </div>
                            <div id="q-fields-top" style="display:none;">
                                <div class="q-input-row">
                                    <div class="q-group"><label>Altura (cm)</label><input type="text" id="q-h-val" class="q-input" placeholder="Ex: 175"></div>
                                    <div class="q-group"><label>Peso (kg)</label><input type="text" id="q-w-val" class="q-input" placeholder="Ex: 80"></div>
                                </div>
                            </div>
                            <div id="q-fields-bottom" style="display:none;">
                                <div class="q-input-row">
                                    <div class="q-group"><label>Cintura (cm)</label><input type="text" id="q-cin-val" class="q-input" placeholder="Ex: 84"><p class="q-input-hint">Me\u00E7a ao redor do umbigo</p></div>
                                    <div class="q-group"><label>Quadril (cm)</label><input type="text" id="q-quad-val" class="q-input" placeholder="Ex: 100"><p class="q-input-hint">Parte mais larga do quadril</p></div>
                                </div>
                            </div>
                        </div>
                        <p style="margin:10px 0 10px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--q-text-light);text-align:center;">Sua foto deve seguir estes requisitos:</p>
                        <div class="q-tips-grid" style="margin-top:0;">
                            <div class="q-tip-item"><i class="ph ph-t-shirt"></i><span>Com Roupa</span></div>
                            <div class="q-tip-item"><i class="ph ph-person"></i><span>Corpo Inteiro</span></div>
                            <div class="q-tip-item"><i class="ph ph-sun"></i><span>Boa Luz</span></div>
                        </div>
                        <div style="display:flex;gap:20px;justify-content:center;margin-top:30px;">
                            <div id="q-trigger-upload" style="width:120px;height:160px;border:1px solid var(--q-border);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--q-gray);transition:0.3s;">
                                <i class="ph ph-camera-plus" style="font-size:32px;color:var(--q-primary);margin-bottom:10px;"></i>
                                <span style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Enviar Foto</span>
                                <input type="file" id="q-real-input" accept="image/*" style="display:none">
                            </div>
                            <div id="q-pre-view" style="display:none;width:120px;height:160px;overflow:hidden;border:1px solid var(--q-border);">
                                <img id="q-pre-img" style="width:100%;height:100%;object-fit:cover;">
                            </div>
                        </div>
                        <button class="q-btn-black" id="q-btn-generate" disabled>Ver no meu corpo</button>
                    </div>
                    <div style="display:none;padding:60px 0;text-align:center;" id="q-loading-box">
                        <div style="font-weight:600;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;animation:q-pulse-text 1.5s infinite ease-in-out;">Gerando Prova Virtual...</div>
                        <div style="height:1px;background:var(--q-gray);width:100%;position:relative;overflow:hidden;">
                            <div style="position:absolute;top:0;left:0;height:100%;width:30%;background:var(--q-primary);animation:q-slide 1.5s infinite linear;"></div>
                        </div>
                    </div>
                    <div id="q-step-result" style="display:none;flex-direction:column;align-items:center;">
                        <div id="q-result-img-col" style="width:100%;border:1px solid var(--q-border);margin-bottom:30px;background:var(--q-gray);">
                            <img id="q-final-view-img" style="width:100%;height:auto;display:block;">
                        </div>
                        <div id="q-result-actions-col" style="width:100%;">
                            <span class="q-res-title" style="display:none;">Provador Virtual</span>
                            <span class="q-res-subtitle" style="display:none;">Simula\u00E7\u00E3o baseada no seu perfil corporal</span>
                            <div class="q-metrics-row" style="display:none;">
                                <div class="q-metric-card"><span class="q-metric-label">Altura</span><span class="q-metric-value" id="q-res-height">\u2014</span><span class="q-metric-unit">m</span></div>
                                <div class="q-metric-card"><span class="q-metric-label">Peso</span><span class="q-metric-value" id="q-res-weight">\u2014</span><span class="q-metric-unit">kg</span></div>
                            </div>
                            <div class="q-res-note" style="display:none;">
                                <i class="ph ph-info"></i>
                                <span>A simula\u00E7\u00E3o AI considera o caimento do tecido baseado na sua estrutura corporal informada.</span>
                            </div>
                            <button class="q-btn-buy" id="q-add-to-cart-btn">
                                <i class="ph ph-shopping-cart"></i>
                                Adicionar ao Carrinho
                            </button>
                            <button class="q-btn-outline" id="q-btn-back">Voltar ao Produto</button>
                            <p class="q-res-mobile-only" style="margin-top:30px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--q-text-light);cursor:pointer;text-decoration:underline;text-underline-offset:4px;" id="q-retry-btn">Tentar outra foto</p>
                        </div>
                    </div>
                </div>
                <div class="q-powered-footer">
                    <span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--q-text-light);">Powered by</span>
                    <a href="https://provoulevou.com.br" target="_blank" style="display:block;margin:0;padding:0;line-height:0;">
                        <img src="https://i.ibb.co/jP66Xwqt/logo-provou-levou-sem-fundo.png" class="q-quantic-logo">
                    </a>
                </div>
            </div>
        </div>
    `;

    function init() {
        console.log('[Provador] init() executado');

        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        if (!window.phosphorIconsLoaded) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            document.head.appendChild(ph);
            window.phosphorIconsLoaded = true;
        }

        const styleTag = document.createElement('style');
        styleTag.innerHTML = styles;
        document.head.appendChild(styleTag);

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);
        console.log('[Provador] Modal HTML injetado');

        const openBtn = document.createElement('button');
        openBtn.className = 'q-btn-trigger-ia';
        openBtn.id = 'q-open-ia';
        openBtn.innerHTML = '<i class="ph ph-user"></i> Provador Virtual';

        const variantContainer = document.querySelector('.atributos');
        console.log('[Provador] Container .atributos:', variantContainer ? 'ENCONTRADO' : 'nao encontrado');

        if (variantContainer) {
            variantContainer.insertAdjacentElement('afterend', openBtn);
            console.log('[Provador] Botao inserido APOS .atributos');
        } else {
            const principal = document.querySelector('.principal');
            if (principal) {
                principal.appendChild(openBtn);
                console.log('[Provador] Botao inserido dentro de .principal');
            } else {
                openBtn.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);';
                document.body.appendChild(openBtn);
                console.warn('[Provador] Nenhum container encontrado — botao fixo');
            }
        }

        const modal = document.getElementById('q-modal-ia');
        const genBtn = document.getElementById('q-btn-generate');
        const closeBtn = document.getElementById('q-close-btn');
        const backBtn = document.getElementById('q-btn-back');
        const retryBtn = document.getElementById('q-retry-btn');
        const realInput = document.getElementById('q-real-input');
        const triggerUpload = document.getElementById('q-trigger-upload');
        const phoneInput = document.getElementById('q-phone');

        let userPhoto = null;

        function applyProduct(product) {
            currentProduct = product;
            document.getElementById('q-fields-top').style.display = product.category === 'top' ? 'block' : 'none';
            document.getElementById('q-fields-bottom').style.display = product.category === 'bottom' ? 'block' : 'none';
        }

        openBtn.onclick = () => {
            const prodName = document.querySelector('h1.titulo, h1.nome-produto, .produto-nome h1, h1')?.innerText || document.title;
            console.log('[Provador] Abrindo modal. Produto:', prodName);
            applyProduct(detectProduct(prodName));
            modal.style.display = 'flex';
        };

        closeBtn.onclick = () => modal.style.display = 'none';
        backBtn.onclick = () => modal.style.display = 'none';

        retryBtn.onclick = () => {
            document.getElementById('q-step-result').style.display = 'none';
            document.getElementById('q-step-upload').style.display = 'block';
            document.querySelector('.q-card-ia').classList.remove('is-result');
            userPhoto = null;
            document.getElementById('q-pre-view').style.display = 'none';
            checkFields();
        };

        triggerUpload.onclick = () => realInput.click();

        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            checkFields();
        });

        function checkFields() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = nums.length >= 10 && nums.length <= 11;
            document.getElementById('q-phone-error').style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : 'var(--q-border)';
            let measOk = currentProduct.category === 'top'
                ? !!document.getElementById('q-h-val').value && !!document.getElementById('q-w-val').value
                : !!document.getElementById('q-cin-val').value && !!document.getElementById('q-quad-val').value;
            genBtn.disabled = !(measOk && userPhoto && phoneOk);
        }

        ['q-h-val', 'q-w-val', 'q-cin-val', 'q-quad-val'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', checkFields);
        });

        realInput.onchange = (e) => {
            userPhoto = e.target.files[0];
            if (userPhoto) {
                const rd = new FileReader();
                rd.onload = ev => {
                    document.getElementById('q-pre-img').src = ev.target.result;
                    document.getElementById('q-pre-view').style.display = 'block';
                    checkFields();
                };
                rd.readAsDataURL(userPhoto);
            }
        };

        genBtn.onclick = async () => {
            // Tenta primeiro capturar a variável global de imagem da Loja Integrada
            let prodImg = window.imagem_grande || '';

            if (!prodImg) {
                const selectors = [
                    '#imagemProduto',
                    '.conteiner-imagem img',
                    'img[itemprop="image"]',
                    '.wrap_pgprod_grid img',
                    '.grid_layout_pagprod img',
                    '.produto-imagem-principal img',
                    '[data-elemento="imagem-principal"]',
                    '.principal .imagem img',
                    '.foto-produto',
                    '#foto-produto'
                ];

                let candidates = [];
                let tags = document.querySelectorAll(selectors.join(', '));

                for (let tag of tags) {
                    let url = tag.src || tag.dataset.src || tag.getAttribute('data-zoom-image') || tag.srcset?.split(' ')[0] || '';
                    if (url && !url.includes('base64') && !url.includes('PRODUTO_IMAGEM') && url.length > 15) {
                        let weight = 0;
                        if (url.includes('large') || url.includes('2500x2500') || url.includes('1000x1000')) weight += 60;
                        if (url.includes('/produto/')) weight += 30;
                        if (tag.id === 'imagemProduto' || tag.getAttribute('itemprop') === 'image') weight += 50;
                        if (tag.closest('.conteiner-imagem')) weight += 40;
                        if (url.includes('64x64') || url.includes('128x128') || url.includes('90x90') || url.includes('64x50')) weight -= 100;

                        candidates.push({ url, weight });
                    }
                }

                candidates.sort((a, b) => b.weight - a.weight);
                prodImg = candidates.length > 0 ? candidates[0].url : '';
            }

            if (!prodImg) {
                prodImg = document.querySelector('meta[property="og:image"]')?.content ||
                    document.querySelector('meta[name="twitter:image"]')?.content || '';
            }

            // Garante URL absoluta
            if (prodImg && prodImg.startsWith('//')) {
                prodImg = window.location.protocol + prodImg;
            } else if (prodImg && !prodImg.startsWith('http')) {
                prodImg = window.location.origin + (prodImg.startsWith('/') ? '' : '/') + prodImg;
            }

            const prodName = document.querySelector('h1.nome-produto, h1.titulo, .produto-nome h1, h1')?.innerText || document.title;

            console.log('[Provador] Produto:', prodName, '| Imagem:', prodImg);

            document.getElementById('q-step-upload').style.display = 'none';
            document.getElementById('q-loading-box').style.display = 'block';

            try {
                const fd = new FormData();
                fd.append('person_image', userPhoto);
                fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                fd.append('phone_raw', phoneInput.value);
                fd.append('product_name', prodName);
                fd.append('product_type', currentProduct.category);
                fd.append('product_fit', currentProduct.fit);

                if (currentProduct.category === 'top') {
                    fd.append('height', document.getElementById('q-h-val').value);
                    fd.append('weight', document.getElementById('q-w-val').value);
                } else {
                    fd.append('cintura', document.getElementById('q-cin-val').value);
                    fd.append('quadril', document.getElementById('q-quad-val').value);
                }

                if (prodImg) {
                    try {
                        const b = await fetch(prodImg).then(r => r.blob());
                        fd.append('product_image', b, 'p.png');
                        console.log('[Provador] Imagem anexada ao FormData');
                    } catch (err) {
                        console.warn('[Provador] Nao foi possivel baixar a imagem (CORS?):', err);
                        // Fallback: enviar apenas a URL se a imagem nao puder ser baixada
                        fd.append('product_image_url', prodImg);
                    }
                }

                calculateFinalSize();

                const res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });
                if (res.ok) {
                    const blob = await res.blob();
                    document.getElementById('q-loading-box').style.display = 'none';
                    document.getElementById('q-final-view-img').src = URL.createObjectURL(blob);

                    const hVal = document.getElementById('q-h-val').value;
                    const wVal = document.getElementById('q-w-val').value;
                    const cVal = document.getElementById('q-cin-val').value;
                    const resH = document.getElementById('q-res-height');
                    const resW = document.getElementById('q-res-weight');
                    if (resH) resH.textContent = hVal ? (parseFloat(hVal) / 100).toFixed(2) : '\u2014';
                    if (resW) resW.textContent = wVal || (cVal ? cVal + ' cm' : '\u2014');

                    document.querySelector('.q-card-ia').classList.add('is-result');
                    document.getElementById('q-step-result').style.display = 'flex';

                } else { throw new Error(); }
            } catch (e) {
                console.error('[Provador] Erro ao gerar prova:', e);
                alert('Ocorreu um erro ao processar sua imagem. Tente novamente.');
                location.reload();
            }
        };

        document.getElementById('q-add-to-cart-btn').onclick = () => {
            const size = recommendedSize;
            console.log('[Provador] Adicionando ao carrinho. Tamanho:', size);

            let selected = false;

            const attrLinks = document.querySelectorAll('.atributo-comum a, .atributo-item');
            for (const link of attrLinks) {
                const txt = link.dataset.variacaoNome || link.textContent.trim();
                if (txt.toUpperCase() === size.toUpperCase()) {
                    link.click();
                    selected = true;
                    console.log('[Provador] Tamanho selecionado via .atributo-item:', txt);
                    break;
                }
            }

            if (!selected) {
                const selects = document.querySelectorAll('select');
                for (const sel of selects) {
                    const opt = [...sel.options].find(o =>
                        o.value.trim().toUpperCase() === size.toUpperCase() ||
                        o.text.trim().toUpperCase() === size.toUpperCase()
                    );
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                        selected = true;
                        console.log('[Provador] Tamanho selecionado via select');
                        break;
                    }
                }
            }

            if (!selected) console.warn('[Provador] Tamanho nao encontrado na pagina:', size);

            function tryAddToCart() {
                const addBtnSelectors = [
                    '.botao.principal', '.botao-comprar', '.btn-add-to-cart',
                    'button.principal', 'a.botao.principal', '[data-btn-comprar]',
                    'button[type="submit"]', '#btn-comprar',
                ];
                for (const sel of addBtnSelectors) {
                    const btn = document.querySelector(sel);
                    if (btn && !btn.disabled) {
                        btn.click();
                        console.log('[Provador] Botao comprar clicado:', sel);
                        if (typeof $ !== 'undefined') {
                            $('body').on('minicart_state_changed', function () {
                                modal.style.display = 'none';
                            });
                        }
                        return true;
                    }
                }
                console.warn('[Provador] Botao comprar nao encontrado');
                return false;
            }

            setTimeout(() => {
                const ok = tryAddToCart();
                if (!ok) setTimeout(() => tryAddToCart(), 400);
                setTimeout(() => { modal.style.display = 'none'; }, 1200);
            }, selected ? 300 : 0);
        };

        console.log('[Provador] Todos os eventos registrados com sucesso');
    }

    if (document.readyState === 'loading') {
        console.log('[Provador] Aguardando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('[Provador] DOM ja pronto, executando init()');
        init();
    }

})();