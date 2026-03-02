(function () {
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
        document.getElementById('q-res-letter').innerText = recommendedSize;
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
        document.getElementById('q-res-letter').innerText = recommendedSize;
    }

    function calculateFinalSize() {
        if (currentProduct.category === 'top') calcTop(currentProduct.fit);
        else calcBottom(currentProduct.fit);
    }

    // ─── ESTILOS ──────────────────────────────────────────────────────────────────
    // (mantém os mesmos estilos do original — sem alterações necessárias)
    const styles = `/* ... cole aqui o bloco styles original sem alterações ... */`;

    // ─── HTML ─────────────────────────────────────────────────────────────────────
    // (mantém o mesmo HTML do original — sem alterações necessárias)
    const html = `<!-- ... cole aqui o bloco html original sem alterações ... -->`;

    // ─── INIT ─────────────────────────────────────────────────────────────────────

    function init() {
        // Fontes e ícones
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // ⚠️ ADAPTAÇÃO: Loja Integrada usa FontAwesome 3.2.1 nativo.
        // Phosphor Icons é usado APENAS no modal (não conflita).
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

        const openBtn = document.createElement('button');
        openBtn.className = 'q-btn-trigger-ia';
        openBtn.id = 'q-open-ia';
        openBtn.innerHTML = '<i class="ph ph-user"></i><span>Provador Virtual</span>';

        // ⚠️ ADAPTAÇÃO: Seletores de galeria da Loja Integrada
        const imgContainers = [
            '.produto-imagem-principal',   // container principal da imagem
            '.produto-detalhe .flexslider',// galeria com flexslider
            '.produto-detalhe',            // fallback: área de detalhe do produto
            '.imagem-produto',
            '#produto-imagem',
        ];
        let placed = false;
        for (const sel of imgContainers) {
            const el = document.querySelector(sel);
            if (el) {
                if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
                el.appendChild(openBtn);
                openBtn.style.cssText = 'position:absolute;top:0;left:50%;transform:translateX(-50%);margin:0;';
                placed = true; break;
            }
        }
        if (!placed) {
            openBtn.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);top:auto;';
            document.body.appendChild(openBtn);
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
            // ⚠️ ADAPTAÇÃO: Seletores de título da Loja Integrada
            const prodName = document.querySelector(
                'h1.titulo, h1.nome-produto, .produto-nome h1, h1'
            )?.innerText || document.title;
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
            // ⚠️ ADAPTAÇÃO: Seletores de imagem e título da Loja Integrada
            const prodImgTag = document.querySelector(
                '.produto-imagem-principal img, .produto-detalhe img, img.foto-produto-detalhe'
            );
            const prodImg = prodImgTag ? prodImgTag.src : (document.querySelector('meta[property="og:image"]')?.content || '');
            const prodName = document.querySelector(
                'h1.titulo, h1.nome-produto, .produto-nome h1, h1'
            )?.innerText || document.title;

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
                    try { const b = await fetch(prodImg).then(r => r.blob()); fd.append('product_image', b, 'p.png'); } catch (_) { }
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
                    if (resH) resH.textContent = hVal ? (parseFloat(hVal) / 100).toFixed(2) : '—';
                    if (resW) resW.textContent = wVal || (cVal ? cVal + ' cm' : '—');

                    const letterPC = document.getElementById('q-res-letter-pc');
                    if (letterPC) letterPC.textContent = recommendedSize;

                    document.querySelector('.q-card-ia').classList.add('is-result');
                    document.getElementById('q-step-result').style.display = 'flex';

                } else { throw new Error(); }
            } catch (e) {
                alert('Ocorreu um erro ao processar sua imagem. Tente novamente.');
                location.reload();
            }
        };

        // ─── ADICIONAR AO CARRINHO — ADAPTADO PARA LOJA INTEGRADA ─────────────────

        document.getElementById('q-add-to-cart-btn').onclick = () => {
            const size = recommendedSize;

            // ── 1. Seleção de tamanho na Loja Integrada ──
            // A LI usa links/âncoras dentro de .atributo-comum ou inputs radio
            const swatchSelectors = [
                // Atributos por texto (ex: link com texto "M", "G" etc.)
                `.atributo-comum a`,
                `.atributos-produto a`,
                `input[type="radio"][value="${size}"]`,
                `input[type="radio"][data-value="${size}"]`,
                `[data-value="${size}"]`,
            ];

            let selected = false;

            // Busca links de atributo cujo texto bate com o tamanho
            const attrLinks = document.querySelectorAll('.atributo-comum a, .atributos-produto a');
            for (const link of attrLinks) {
                if (link.textContent.trim().toUpperCase() === size.toUpperCase()) {
                    link.click();
                    selected = true;
                    break;
                }
            }

            // Fallback: radio buttons
            if (!selected) {
                for (const sel of swatchSelectors.slice(2)) {
                    const el = document.querySelector(sel);
                    if (el) {
                        el.click();
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        selected = true;
                        break;
                    }
                }
            }

            // Fallback: <select> nativo
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
                        break;
                    }
                }
            }

            // ── 2. Clica no botão de comprar da Loja Integrada ──
            function tryAddToCart() {
                const addBtnSelectors = [
                    // ⚠️ ADAPTAÇÃO: classes nativas da Loja Integrada
                    '.botao.principal',
                    '.botao-comprar',
                    '.btn-add-to-cart',
                    'button.principal',
                    'a.botao.principal',
                    '[data-btn-comprar]',
                    // fallbacks genéricos
                    'button[type="submit"]',
                    '#btn-comprar',
                ];
                for (const sel of addBtnSelectors) {
                    const btn = document.querySelector(sel);
                    if (btn && !btn.disabled) {
                        btn.click();
                        // ⚠️ ADAPTAÇÃO: escuta o evento nativo da LI para confirmar adição
                        $('body').on('minicart_state_changed', function () {
                            modal.style.display = 'none';
                        });
                        return true;
                    }
                }
                return false;
            }

            setTimeout(() => {
                const ok = tryAddToCart();
                if (!ok) setTimeout(() => tryAddToCart(), 400);
                // Fecha modal mesmo sem confirmar via evento
                setTimeout(() => { modal.style.display = 'none'; }, 1200);
            }, selected ? 300 : 0);
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
