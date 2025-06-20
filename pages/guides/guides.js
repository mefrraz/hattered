document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // Seleção de elementos do DOM
    // ===================================
    const latestPostsDiv = document.querySelector('.latest-posts');
    const mainNewsDiv = document.querySelector('.main-news');
    const navCategoriesDiv = document.querySelector('.nav-categories');
    const sidebarContentDiv = document.querySelector('.sidebar-content');
    const menuToggleButton = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const closeSidebarButton = document.querySelector('.close-sidebar');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const morePostsSection = document.querySelector('.more-posts-section');
    const morePostsGridDiv = document.querySelector('.more-posts-grid');
    const morePostsTitle = morePostsSection ? morePostsSection.querySelector('h3') : null;
    const contentWrapper = document.querySelector('.content.two-columns');


    if (searchInput) {
        searchInput.placeholder = "Pesquisar posts, guias...";
    }

    // ===================================
    // Variáveis de estado
    // ===================================
    let allPosts = [];
    let currentCategoryFilter = 'Todas';
    let currentSearchTerm = '';
    let debounceTimer; 

    // ===================================
    // Constantes de configuração
    // ===================================
    const MAX_DESCRIPTION_LENGTH_LATEST = 100;
    const MAX_NAV_CATEGORIES = 5;
    const LATEST_POSTS_COUNT = 6;
    const MAIN_POSTS_COUNT = 2;
    const MAX_DESCRIPTION_LENGTH_MORE_POSTS = 140;


    // ===================================
    // Funções Principais
    // ===================================
    async function fetchGuides() {
        try {
            const response = await fetch('guides_list.txt');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            return parseGuides(text);
        } catch (error) {
            console.error('Erro ao carregar o arquivo guides_list.txt:', error);
            if (latestPostsDiv) latestPostsDiv.innerHTML = '<p>Erro ao carregar os posts.</p>';
            if (mainNewsDiv) mainNewsDiv.innerHTML = '<p>Erro ao carregar os posts.</p>';
            return [];
        }
    }

    function parseGuides(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        return lines.map((line, index) => {
            const parts = line.split('|');
            if (parts.length >= 5) {
                return {
                    id: `post-${index}`,
                    category: parts[0].trim(),
                    link: parts[1].trim(),
                    title: parts[2].trim(),
                    description: parts[3].trim(),
                    isMain: parts[4].trim().toLowerCase() === 'principal',
                    imagePath: parts[5] ? parts[5].trim() : null
                };
            } else {
                console.warn('Linha inválida ignorada:', line);
                return null;
            }
        }).filter(post => post !== null);
    }

    // Função central que decide o que mostrar com base no tamanho do ecrã
    function renderPage() {
        const screenWidth = window.innerWidth;

        if (screenWidth <= 1024) { // Lógica para TABLET e TELEMÓVEL
            renderSimplifiedView();
        } else { // Lógica para DESKTOP
            renderDesktopView();
        }
    }

    // NOVA FUNÇÃO: Renderiza a vista simplificada para Tablet e Telemóvel
    function renderSimplifiedView() {
        if (!morePostsSection || !contentWrapper) return;

        // Esconde o conteúdo do topo e mostra a secção de lista de posts
        contentWrapper.style.display = 'none';
        morePostsSection.style.display = 'block';

        let sourceData = allPosts;
        let title = 'Posts';

        // Aplica filtro de categoria
        if (currentCategoryFilter !== 'Todas') {
            sourceData = sourceData.filter(post => post.category === currentCategoryFilter);
            title = currentCategoryFilter;
        }

        // Aplica filtro de pesquisa
        if (currentSearchTerm.trim() !== '') {
            const term = currentSearchTerm.toLowerCase();
            sourceData = sourceData.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.description.toLowerCase().includes(term) ||
                post.category.toLowerCase().includes(term)
            );
            title = `Resultados para "${currentSearchTerm}"`;
        }

        if (morePostsTitle) morePostsTitle.textContent = title;
       
        // No telemóvel e tablet, todos os posts são mostrados como cartões normais
        const postsToShow = sourceData;

        morePostsGridDiv.innerHTML = '';
        if (postsToShow.length === 0) {
            morePostsGridDiv.innerHTML = '<p>Nenhum post encontrado.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        postsToShow.forEach(post => {
            // A função createColumnPostElement já não exibe imagens, por isso é seguro usar para todos.
            fragment.appendChild(createColumnPostElement(post, MAX_DESCRIPTION_LENGTH_LATEST));
        });
        morePostsGridDiv.appendChild(fragment);
    }

    // Lógica para a vista de desktop
    function renderDesktopView() {
        if (currentCategoryFilter !== 'Todas') {
            if (contentWrapper) contentWrapper.style.display = 'none';
            if (morePostsSection) morePostsSection.style.display = 'block';
            if (morePostsTitle) morePostsTitle.textContent = currentCategoryFilter;
            const categoryPosts = allPosts.filter(post => post.category === currentCategoryFilter);
            renderMorePosts(categoryPosts, new Set());
        } else {
            if (contentWrapper) contentWrapper.style.display = 'flex';
            if (morePostsSection) morePostsSection.style.display = 'block';
            if (morePostsTitle) morePostsTitle.textContent = 'Mais Posts';
           
            let sourceData = allPosts;
            if (currentSearchTerm.trim() !== '') {
                const term = currentSearchTerm.toLowerCase();
                sourceData = allPosts.filter(post =>
                    post.title.toLowerCase().includes(term) ||
                    post.description.toLowerCase().includes(term) ||
                    post.category.toLowerCase().includes(term)
                );
            }
           
            const postsShownOnTop = new Set();
            renderLatestPosts(sourceData, postsShownOnTop);
            renderMainNews(sourceData, postsShownOnTop);
            renderMorePosts(sourceData, postsShownOnTop);
        }
    }

    // Funções de renderização de secções (usadas pela vista de desktop)
    function renderLatestPosts(posts, postsShownOnTop) {
        if (!latestPostsDiv) return;
        latestPostsDiv.innerHTML = '';
        const latest = posts.filter(post => !post.isMain).slice(0, LATEST_POSTS_COUNT);
        if (latest.length === 0) {
            latestPostsDiv.innerHTML = '<p>Nenhum post recente encontrado.</p>';
            return;
        }
        const fragment = document.createDocumentFragment();
        latest.forEach(post => {
            fragment.appendChild(createColumnPostElement(post, MAX_DESCRIPTION_LENGTH_LATEST));
            postsShownOnTop.add(post.id);
        });
        latestPostsDiv.appendChild(fragment);
    }

    function renderMainNews(posts, postsShownOnTop) {
        if (!mainNewsDiv) return;
        mainNewsDiv.innerHTML = '';
        const mainPosts = posts.filter(post => post.isMain).slice(0, MAIN_POSTS_COUNT);
        if (mainPosts.length === 0) {
            mainNewsDiv.innerHTML = '<p>Nenhum post em destaque encontrado.</p>';
            return;
        }
       
        const mainHighlight = createMainPostElement(mainPosts[0]);
        mainNewsDiv.appendChild(mainHighlight);
        postsShownOnTop.add(mainPosts[0].id);

        if (mainPosts.length > 1) {
            const secondary = createColumnPostElement(mainPosts[1], null);
            secondary.classList.add('main-secondary');
            mainNewsDiv.appendChild(secondary);
            postsShownOnTop.add(mainPosts[1].id);
        }
    }

    function renderMorePosts(posts, postsShownOnTop) {
        if (!morePostsGridDiv || !morePostsSection) return; 
       
        morePostsGridDiv.innerHTML = '';
        const remainingPosts = posts.filter(post => !postsShownOnTop.has(post.id));

        if (remainingPosts.length === 0) {
            morePostsSection.style.display = 'none';
            return;
        }
        morePostsSection.style.display = 'block';
        const fragment = document.createDocumentFragment();
        remainingPosts.forEach(post => {
            fragment.appendChild(createColumnPostElement(post, MAX_DESCRIPTION_LENGTH_MORE_POSTS));
        });
        morePostsGridDiv.appendChild(fragment);
    }

    // Funções de criação de elementos HTML
    function createColumnPostElement(post, truncationLimit) {
        const article = document.createElement('article');
        article.classList.add('column-post-item');
       
        let desc = post.description;
        if (truncationLimit && post.description.length > truncationLimit) {
            desc = post.description.slice(0, truncationLimit) + '...';
        }
        article.innerHTML = `
            <h4><a href="${post.link}" class="post-link-expansivo">${post.title}</a></h4>
            <p class="description">${desc}</p>
            <span class="category-info">${post.category}</span>
        `;
        return article;
    }

    function createMainPostElement(post) {
        const article = document.createElement('article');
        article.classList.add('column-post-item', 'main-highlight');
        const imgHtml = post.imagePath ? `<img src="${post.imagePath}" alt="${post.title}" class="post-image">` : '';
        article.innerHTML = `
            ${imgHtml}
            <h4><a href="${post.link}" class="post-link-expansivo">${post.title}</a></h4>
            <p class="description">${post.description}</p>
            <span class="category-info">${post.category}</span>
        `;
        return article;
    }

    // Funções de Interação
    function populateCategories(posts) {
        if (!navCategoriesDiv || !sidebarContentDiv) return;
        const categories = new Set(posts.map(p => p.category));
        const sorted = Array.from(categories).sort();
        navCategoriesDiv.innerHTML = '';
        sidebarContentDiv.innerHTML = '';
        addCategoryLink('Todas', navCategoriesDiv);
        addCategoryLink('Todas', sidebarContentDiv);
        sorted.slice(0, MAX_NAV_CATEGORIES).forEach(cat => addCategoryLink(cat, navCategoriesDiv));
        sorted.forEach(cat => addCategoryLink(cat, sidebarContentDiv));
        setActiveCategory(currentCategoryFilter);
    }

    function addCategoryLink(name, container) {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = name;
        a.dataset.category = name;
        a.addEventListener('click', e => {
            e.preventDefault();
            filterPostsByCategory(name);
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });
        container.appendChild(a);
    }

    function filterPostsByCategory(category) {
        currentCategoryFilter = category;
        currentSearchTerm = '';
        if (searchInput) searchInput.value = '';
        renderPage();
        setActiveCategory(category);
    }

    function setActiveCategory(category) {
        document.querySelectorAll('.nav-categories a, .sidebar-content a').forEach(link => {
            link.classList.toggle('active', link.dataset.category === category);
        });
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        const overlay = document.querySelector('.overlay');
        if (overlay) {
            overlay.remove();
        }
    }
   
    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (!document.querySelector('.overlay')) {
                const overlay = document.createElement('div');
                overlay.classList.add('overlay', 'active');
                document.body.appendChild(overlay);
                overlay.addEventListener('click', closeSidebar);
            }
        });
    }

    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', closeSidebar);
    }
   
    function handleSearch() {
        currentSearchTerm = searchInput.value.trim();
        currentCategoryFilter = 'Todas';
        renderPage();
        setActiveCategory('Todas');
    }

    if(searchButton && searchInput) {
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer); 
            debounceTimer = setTimeout(() => {
                handleSearch();
            }, 400); 
        });
    }
   
    // Adiciona um listener para redimensionamento da janela, para trocar entre vistas
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderPage, 150);
    });

    // Função de Inicialização
    async function init() {
        const posts = await fetchGuides();
        allPosts = posts;
        populateCategories(allPosts);
        renderPage();
    }

    init();
});
