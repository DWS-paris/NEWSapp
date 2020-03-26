document.addEventListener('DOMContentLoaded', () => {

    /* 
    Declarations
    */
        const apiUrl = 'https://newsapp.dwsapp.io/api';
        const socket = io('https://174.138.14.93:7498');
        const socketServer = io('https://newsapp.dwsapp.io');
        let newsSources = null;
        let userBookmarks = [];
        const news_api_token = { news_api_token: '97fccbac2fae46b4a05123f1b5aa016b' }

        let RegisterForm = new FormClass( 
            document.querySelector('#registerForm'), 
            document.querySelectorAll('#registerForm input'),
            document.querySelector('#registerForm [name="password"]'),
            document.querySelector('#registerForm [name="passwordRepeat"]')
        );

        let LoginForm = new FormClass( 
            document.querySelector('#loginForm'), 
            document.querySelectorAll('#loginForm input') 
        );

        let NewsForm = new FormClass( 
            document.querySelector('#newsForm'), 
            document.querySelectorAll('#newsForm *:not(button):not(label)') 
        );
    //

    /* 
    Methods
    */
        const toggleLoading = (tag = document.querySelector('#loading')) => {
            if( tag.className === 'open' ){
                // Add close class
                tag.classList.add('close');
                setTimeout(()=> {
                    // Delete open and close class
                    tag.classList.remove('open');
                    tag.classList.remove('close');
                }, 300)
                
            }
            else{
                // Add open class
                tag.classList.add('open');
            }
        }

        const getUserdata = () => {
            return new Promise( (resolve, reject) => {
                // Set fetch data
                const fetchData = { token: localStorage.getItem('user-token') };

                // Get user data
                new FETCHrequest(`${apiUrl}/me`, 'POST', fetchData).fetch()
                .then( apiResponse => resolve(apiResponse))
                .catch( apiError => reject(apiError));
            });
        };

        const getFormSubmissions = () => {
            // Register form
            RegisterForm.formTag.addEventListener('submit', event => {
                // Prevent event default
                event.preventDefault();

                // Check register form
                RegisterForm.checkFormFields()
                .then( formData => { 
                    // Register new user
                    fetchApi('register', formData)
                    .then( apiResponse => {
                        console.log(apiResponse)
                    })
                    .catch( apiErrror => {
                        console.log(apiErrror)
                    })
                 })
                .catch( error => { displayError(error) })
            });

            // Login form
            LoginForm.formTag.addEventListener('submit', event => {
                // Prevent event default
                event.preventDefault();

                // Check login form
                LoginForm.checkFormFields()
                .then( formData => { 
                    // Toggle loading
                    toggleLoading();

                    // Loggin user
                    setTimeout(() => {
                        fetchApi('login', formData)
                        .then( apiResponse => {
                            console.log(apiResponse)
                            // Add token in local storage
                            localStorage.setItem('user-token', apiResponse.data.token);

                            // Reset form
                            LoginForm.formTag.reset();
                            
                            // Display nav
                            displayNav(apiResponse.data);

                            // Toggle loading
                            setTimeout(() => toggleLoading(), 400);
                        })
                        .catch( apiErrror => {
                            console.log(apiErrror)
                        })
                    }, 400);
                 })
                .catch( error => { displayError(error) })
            })

            // News form
            NewsForm.formTag.addEventListener('submit', event => {
                // Toggle loading
                toggleLoading();

                // Prevent event default
                event.preventDefault();

                // Check login form
                NewsForm.checkFormFields()
                .then( formData => { 
                    // Check source value 
                    if( formData.data.source !== 'null' ){
                        // Define keyword
                        const keyword = formData.data.question.length > 0 ? formData.data.question : 'null';

                        // Save source and keyword in local storage
                        localStorage.setItem('last-source', formData.data.source);
                        localStorage.setItem('last-keyword', keyword);

                        // Get news feed
                        new FETCHrequest(`${apiUrl}/news/${formData.data.source}/${keyword}`, 'POST', news_api_token).fetch()
                        .then( apiResponse => displayNewsFeed(apiResponse.data))
                        .catch( apiError => toggleLoading());
                    }
                    else{
                        toggleLoading()
                    }
                 })
                .catch( error => { displayError(error) })
            })
        }

        const fetchApi = async (endpoint, formData = null) => {
            switch( endpoint ){
                case 'register':
                    // Delete repeated password
                    delete formData.data.passwordRepeat;
                break;

                default:
                break;
            }

            // Send data to API
            return new Promise( (resolve, reject) => {
                new FETCHrequest(`${apiUrl}/${endpoint}`, 'POST', formData.data).fetch()
                .then( apiResponse => resolve(apiResponse))
                .catch( apiError => reject(apiError));
            });
        }

        const displayError = errorObject => {
            for( let item in errorObject.data ){
                document.querySelector(`[name="${item}"]`).classList.add('error');
                document.querySelector(`[name="${item}"]`).addEventListener('focus', () => {
                    document.querySelector(`[name="${item}"]`).classList.remove('error');
                })
            }
        }

        const setNewsForm = () => {
            
            return new Promise( (resolve, reject) => {
                new FETCHrequest(`${apiUrl}/news/sources`, 'POST', news_api_token).fetch()
                .then( apiResponse => {
                    // Set news sources collection
                    newsSources = apiResponse.data.sources;

                    // Display source selector
                    for( let item of newsSources ){
                        document.querySelector('#newsForm select').innerHTML += `
                            <option value="${item.id}">${item.name}</option>
                        `;
                    };

                    // Check last search source
                    if( localStorage.getItem('last-source') !== null ){
                        document.querySelector('#newsForm select').value = localStorage.getItem('last-source');
                    }

                    // Check last search keyword
                    if( localStorage.getItem('last-keyword') != null && localStorage.getItem('last-keyword') != 'null' ){
                        document.querySelector('#newsForm input').value = localStorage.getItem('last-keyword');
                    }

                    // Display form
                    document.querySelector('#newsForm').classList.remove('hidden');

                    // Get reset form button click
                    document.querySelector('#newsForm [type="reset"]').addEventListener('click', event => {
                        resetNewsForm();
                    })

                    // Get add to bookmark button click
                    document.querySelector('#addToBookmark').addEventListener('click', event => {
                        setBookmark(localStorage.getItem('last-source'), 'POST');
                    })

                    // Get delete bookmark button click
                    document.querySelector('#deleteBookmark').addEventListener('click', event => {
                        setBookmark(localStorage.getItem('last-source'), 'DELETE');
                    })

                    // Get select change event
                    document.querySelector('#newsForm select').addEventListener('change', event => {
                        let found = 0;
                        for( let item of userBookmarks ){
                            if( item.id === event.srcElement.value){ found++ }
                        }

                        if( found === 1){
                            // Change DOM elements
                            document.querySelector('#addToBookmark').classList.remove('active');
                            document.querySelector('#deleteBookmark').classList.add('active');
                        }
                        else{
                            // Change DOM elements
                            document.querySelector('#addToBookmark').classList.remove('active');
                            document.querySelector('#deleteBookmark').classList.remove('active');
                        }


                    })

                    // Resolve Promise
                    resolve(apiResponse)
                })
                .catch( apiError => reject(apiError));
            });
        }

        const resetNewsForm = () => {
            // Delete local storage
            localStorage.removeItem('last-source');
            localStorage.removeItem('last-keyword');

            // Toggle loading
            toggleLoading();

            // Prevent event default
            event.preventDefault();

            setTimeout(() => {
                // Reset form
                document.querySelector('#newsForm').reset();

                // Remove old articles
                document.querySelector('#newsFeed').innerHTML = '';

                // Toggle loading
                toggleLoading();
            }, 300);
        }

        const displayNewsFeed = data => {
            document.querySelector('#deleteBookmark').classList.remove('active');
            document.querySelector('#addToBookmark').classList.add('active');

            // Check if source is bookmarked
            for( let item of userBookmarks ){
                if(item.id === localStorage.getItem('last-source')){
                    document.querySelector('#deleteBookmark').classList.add('active');
                    document.querySelector('#addToBookmark').classList.remove('active');
                }
            }

            // Remove old articles
            document.querySelector('#newsFeed').innerHTML = '';

            // Check data lenght
            if( data.articles.length > 0 ){
                // Loop on data collection
                for( let item of data.articles ){
                    document.querySelector('#newsFeed').innerHTML += `
                        <li>
                            <div class="cover" style=" background-image: url(${item.urlToImage})"></div>
                            <ul>
                                <li class="publishedAt">Published at ${new Intl.DateTimeFormat('en-US').format(new Date(item.publishedAt))}</li>
                                <li class="title">${item.title}</li>
                                <li class="description">${item.description.slice(0, 60)}...</li>
                                <li class="readMore"><a href="${item.url}" target="_blank">Read more</a></li>
                            </ul>
                        </li>
                    `;
                }
            }
            else{
                document.querySelector('#newsFeed').innerHTML = '<li>New news found...</li>';
            }

            // Toggle loading
            toggleLoading();
        }

        const displayNav = userData => {
            // Hide register and login form
            document.querySelector('#registerForm').classList.add('hidden');
            document.querySelector('#loginForm').classList.add('hidden');
            
            // Define user bookmarks
            if( userBookmarks.length > 0 ){
                let bookmarks = '';
                for( let item of userBookmarks ){
                    bookmarks += `<li><button class="userBookmarkBtn" item-id="${item.id}">${item.name}</button></li>`;
                }

                // Display DOM elements
                document.querySelector('nav ul').innerHTML += `
                    <li class="userName">Welcome ${userData.user.firstname} ${userData.user.lastname} <button id="logoutBtn"><i class="fas fa-sign-out-alt"></i></button></li>
                    <ul class="bookmarks">
                        <li>Your bookmarks</li>
                        <ul class="bookmarksLit">${bookmarks}</ul>
                    </ul>
                `;
            }
            else{
                // Display DOM elements
                document.querySelector('nav ul').innerHTML += `
                    <li class="userName">Welcome ${userData.user.firstname} ${userData.user.lastname} <button id="logoutBtn"><i class="fas fa-sign-out-alt"></i></button></li>
                `;
            }

            // Get bookmark button click
            for( let item of document.querySelectorAll('.userBookmarkBtn') ){ getBookmarkButtonClick(item) }

            // Get logout button click
            document.querySelector('#logoutBtn').addEventListener('click', () => {
                // Toggle loading
                toggleLoading();

                // Fetch API
                setTimeout(() => {
                    new FETCHrequest(`${apiUrl}/logout`, 'GET').fetch()
                    .then( () => logoutUser())
                    .catch( apiError => console.log(apiError));
                }, 400);
            })
        }

        const logoutUser = () => {
            // Remove local storage
            localStorage.removeItem('user-token');
            localStorage.removeItem('last-source');
            localStorage.removeItem('last-keyword');

            // Display register and login form
            document.querySelector('#registerForm').classList.remove('hidden');
            document.querySelector('#loginForm').classList.remove('hidden');

            // Edit nav elements
            document.querySelector('nav ul').innerHTML = '<li class="title">News feed</li>';

            // Toggle loading
            setTimeout(() => {
                toggleLoading();
            }, 400);
        }

        const getBookmarkButtonClick = tag => {
            tag.addEventListener('click', () => {
                // Toggle loading
                toggleLoading();

                // Fetch API
                setTimeout(() => {
                    // Set news form and local storage
                    document.querySelector('#newsForm select').value = tag.getAttribute('item-id');
                    localStorage.setItem('last-source', tag.getAttribute('item-id'));

                    new FETCHrequest(`${apiUrl}/news/${tag.getAttribute('item-id')}/null`, 'GET').fetch()
                    .then( apiResponse => displayNewsFeed(apiResponse.data))
                    .catch( apiError => toggleLoading());
                }, 400);
            })
        }

        const setBookmark = (bookmark, type) => {
            // Check type
            if( type === 'POST' ){
                // Get news source data
                for( let item of newsSources ){
                    if( item.id === bookmark ){
                        // Add user token
                        item.token = localStorage.getItem('user-token');

                        // Get news feed
                        new FETCHrequest(`${apiUrl}/bookmark`, type, item).fetch()
                        .then( apiResponse => {
                            // Add bookmark
                            document.querySelector('.bookmarksLit').innerHTML += `
                                <li><button class="userBookmarkBtn" item-id="${apiResponse.data.data.id}">${apiResponse.data.data.name}</button></li>
                            `;

                            // Get bookmark button click
                            for( let item of document.querySelectorAll('.userBookmarkBtn') ){ getBookmarkButtonClick(item) }

                        })
                        .catch( apiError => console.log(apiError));
                    }
                }

                // Change DOM elements
                document.querySelector('#addToBookmark').classList.remove('active');
                document.querySelector('#deleteBookmark').classList.add('active');
            }
            else if( type === 'DELETE' ){
                // Get user bookmark
                for( let item of userBookmarks ){
                    if( item.id === bookmark ){
                        // Set fetch data
                        const fetchData = { token: localStorage.getItem('user-token') };

                        // Delete user bookmark
                        new FETCHrequest(`${apiUrl}/bookmark/${item._id}`, type, fetchData).fetch()
                        .then( apiResponse => {
                            // Delete bookmark
                            document.querySelector(`[item-id="${bookmark}"]`).parentNode.innerHTML = '';
                        })
                        .catch( apiError => console.log(apiError));
                    }
                }

                // Change DOM elements
                document.querySelector('#deleteBookmark').classList.remove('active');
                document.querySelector('#addToBookmark').classList.add('active');
            }
        }
    //


    /* 
    Start interface
    */
        // Get news form sources
        setNewsForm()
        .then( async () => {
            // Get user data
            const userData = await getUserdata();

            // Check user data
            if(userData.err === null){
                // Set user bookmarks colection
                userBookmarks = userData.data.bookmark;

                // Display nav
                displayNav(userData.data);

                // Check last search source
                if( localStorage.getItem('last-source') !== null ){
                    // Define keyword
                    const keyword = localStorage.getItem('last-keyword') != null ? localStorage.getItem('last-keyword') : 'null';

                    // Get news feed
                    new FETCHrequest(`${apiUrl}/news/${localStorage.getItem('last-source')}/${keyword}`, 'POST', news_api_token).fetch()
                    .then( apiResponse => displayNewsFeed(apiResponse.data))
                    .catch( (apiError) => toggleLoading());
                }
                else{
                    // Toggle loading
                    toggleLoading();
                }
            };
        })
        .catch( apiError => {
            // Toggle loading
            toggleLoading();

            console.log(apiError)
        });

        getFormSubmissions();
    //



})