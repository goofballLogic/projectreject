( async function() {

    const uri = {

        ROOT: ""

    };

    const states = {

        HOME: "home",
        REGION: "region > "

    };

    if ( !detectRequiredFeatures() ) return;
    function detectRequiredFeatures() {

        const renderNotSupported = x => renderInternalError( "Browser not supported", x );
        if ( !( "content" in document.createElement( "template" ) ) )
            return renderNotSupported( "Template elements" ) && false;
        return true;

    }

    const whereami = locateMe();

    const regionsRequest = await fetch( `${uri.ROOT}/data/indexes/regions.json` );
    const regions = regionsRequest.ok ? ( await regionsRequest.json() ) : null;
    if ( !regions ) return renderInternalError( "Loading data (regions)" );

    render();

    function renderHome() {

        removeSection( ".region-home" );
        renderTemplateItems( regions, ".region-picker nav", "#region-choice-template", region => ( {

            "a": { "@href": `?region=${region[ "@id" ]}`, "style":  `background-image: url(${qualifyDataURL( region[ "image" ] )})` },
            "a .region-name": { "textContent": region[ "name" ] }

        } ) );

    }

    async function renderRegionHome() {

        removeSection( ".region-picker" );
        const here = new URL( location.href );
        const region = here.searchParams.get( "region" );
        const regionIndexRequest = await fetch( qualifyDataURL( region ) );
        if ( !regionIndexRequest.ok )
            return renderNotFound( "Selected region" );
        const regionIndex = await regionIndexRequest.json();
        renderTemplateItems( [ regionIndex ], ".region-home", "#region-home-header-template", region => ( {

            "header": { "style": `background-image: url(${qualifyDataURL( region.image )})` },
            ".name": { "textContent": region.name }

        } ), false );
        if ( regionIndex.jobs && regionIndex.jobs.length ) {

            renderTemplateItems( [ regionIndex ], ".region-home", "#region-home-results", region => ( {

                ".name": { "textContent": region.name }

            } ), false );
            renderTemplateItems( regionIndex.jobs, ".region-home .jobs .results", "#region-home-job-template", job => ( {

                ".name": { "textContent": job.title },
                ".description": { "textContent": job.description },
                ".location": { "textContent": job.location },
                ".salary": { "textContent": job.salary },
                ".terms": { "textContent": job.terms }

            } ) );

        } else {

            renderTemplate( ".region-home", "#region-home-no-results", false );

        }

    }

    function locateMe() {

        const here = new URL( location.href );
        if ( here.searchParams.has( "region" ) ) {

            return states.REGION + states.HOME;

        }
        return states.HOME;

    }

    async function render() {

        switch( whereami ) {

            case states.HOME:
                await renderHome();
                break;
            case states.REGION + states.HOME:
                await renderRegionHome();
                break;
            default:
                await renderNotFound();

        }
        document.body.classList.remove( "loading" );

    }

    function removeSection( selector ) {

        document.querySelector( selector ).remove();

    }

    function renderDataAsElement( mapping, elementPrototype ) {

        const element = document.importNode( elementPrototype, true );
        if ( !mapping ) return element;
        for( const selector in mapping ) {

            const selected = element.querySelector( selector );
            const valueMap = mapping[ selector ];
            for( const name in valueMap ) {

                const value = valueMap[ name ];
                if ( name.startsWith( "@" ) )
                    selected.setAttribute( name.substring( 1 ), value );
                else
                    selected[ name ] = value;

            }

        }
        return element;

    }

    function renderTemplate( containerSelector, templateSelector, clearContainer = true ) {

        const container = document.querySelector( containerSelector );
        if ( !container ) return renderInternalError( new Error( `Container not found: ${containerSelector}` ) );
        if ( clearContainer ) container.innerHTML = "";

        const template = document.querySelector( templateSelector );
        if ( !template ) return renderInternalError( new Error( `Template not found: ${templateSelector}` ) );

        const element = document.importNode( template.content, true );
        container.appendChild( element );

    }

    function renderTemplateItems( items, containerSelector, templateSelector, itemTemplateMapper, clearContainer = true ) {

        const container = document.querySelector( containerSelector );
        if ( !container ) return renderInternalError( new Error( `Container not found: ${containerSelector}` ) );
        if ( clearContainer ) container.innerHTML = "";

        if ( !( items && items.length ) ) return;

        const template = document.querySelector( templateSelector );
        if ( !template ) return renderInternalError( new Error( `Template not found: ${templateSelector}` ) );

        items.forEach( item => {

            const mapping = itemTemplateMapper && itemTemplateMapper( item );
            const element = renderDataAsElement( mapping, template.content );
            container.appendChild( element );

        } );

    }

    function renderInternalError( message ) {

        alert( message );

    }

    function qualifyDataURL( maybeURL ) {

        if ( !maybeURL ) return maybeURL;
        if ( /^(https?:\/\/|\/\/)/.test( maybeURL ) ) return maybeURL;
        return `${uri.ROOT}/data/${maybeURL}`;

    }

}() )