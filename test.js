// app using yahoo.com as a search engine
const express = require('express'); // Include ExpressJS
const app = express(); // Create an ExpressJS app
const bodyParser = require('body-parser'); // Middleware 
const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio')
const puppeteer = require('puppeteer');
const request = require('request');
const mysql = require('mysql');

// const connection = mysql.createConnection({
//     host :'sql12.freesqldatabase.com',
//     user:'sql12627038',
//     password:'nILwiGK3gB',
//     database:'sql12627038',
// })

const axiosParallel = require('axios-parallel');

const { performance } = require('perf_hooks');
const fs = require('fs');
const ejs = require("ejs");
// const { AddressContext } = require('twilio/lib/rest/api/v2010/account/address');
const { getElementsByTagType } = require('domutils');
const { off } = require('process');
// var urlForSwiggy, urlForZomato;
// var extractLinksOfSwiggy, extractLinksOfZomato, matchedDishes = {};
// var matchedDishesForSwiggy, matchedDishesForZomato, tempAddress, discCodesForZomato, addr, linkOld = '';
// var z, s, w;
// var sdfd, tempurl, tempurl2;
// var Offers = 0;
app.set('view engine', 'ejs');
app.use(express.static(__dirname));

// app.set('views', './');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// var newItem;
// Route to Login Page
app.get('/', (req, res) => {
    // console.log((req.query['q']));
    res.sendFile(__dirname + '/index.html');
});
app.post('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});



app.get('/limitedTimeOffers', async (req, res) => {

    const { data } = await axios.get("https://netmeds.com");
    const $ = cheerio.load(data);

    const final = [];
    $('.flashsale .swiper-slide').map((i, elm) => {
        final.push({
            title: ($(elm).find('.cat_title').first().text()),
            imgsrc: ($(elm).find('.cat-img img').first().attr('src')),
            fprice: ($(elm).find('#final_price').first().text()),
            oprice: ($(elm).find('.price').first().text()),
        });
    });
    res.send(final);

});


app.post('/getImageData', async (req, res) => {
    const start = performance.now();

    console.log(req.body);

    const browser = await puppeteer.launch({

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]

    })
    const page = await browser.newPage();

    await page.goto(`https://yandex.com/images/search?rpt=imageview&url=${req.body.blah}`);
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);

    await browser.close();

    const final = [];
    const $ = cheerio.load(data, { xmlMode: false });
    $('.CbirSection-Title').map((i, elm) => {
        if ($(elm).text() == "Image appears to contain") {
            console.log('yes')
            $(elm).next().find('a').map((i, elm) => {
                final.push($(elm).text());
            });
        }
    });



    const end = performance.now() - start;
    console.log(`Execution time: ${end}ms`);

    res.render(__dirname + '/imageDetection', { final: final });

});

app.get('/multiSearchOld', async (req, res) => {
    console.log('started')
    const start = performance.now();

    const LinkDataResponses = await axiosParallel(
        ['https://medicomp.in/compare?medname=Dolo-650+Tablet+10%27s',
'https://medicomp.in/compare?medname=Volini+Pain+Relief+Spray%2C+40+gm',
'https://medicomp.in/compare?medname=Moov+Pain+Relief+Cream%2C+15+gm',
'https://medicomp.in/compare?medname=Dolo-650+Tablet+10%27s',
'https://medicomp.in/compare?medname=endoreg%2014s',
]);
    // console.log(LinkDataResponses[0].data);

    for(var i=0;i<5;i++){
        const $ =cheerio.load(LinkDataResponses[i].data);
        console.log($('.bottom-area').html());
    }


    const end = performance.now() - start;
    console.log(`Execution time: ${end}ms`);
});

app.post('/redirect', async (req, res) => {
    console.log(req.body.medlink);
    console.log(req.body.medName);
    console.log(req.body.medicineName);
    const final = []
    final.push(req.body.medlink)
    final.push(req.body.medName)
    final.push(req.body.medicineName)

    const imageLogos = {

        apollo: 'https://image3.mouthshut.com/images/imagesp/925643839s.png',
        netmeds: 'https://cashbackpot.in/img/netmedsede7e2b6d13a41ddf9f4bdef84fdc737.png',
        pharmeasy: 'https://hindubabynames.info/downloads/wp-content/themes/hbn_download/download/health-and-fitness-companies/pharmeasy-logo.png',
        healthskool: 'https://www.healthskoolpharmacy.com/assets/uploads/326389268.png',
        pasumai: 'https://play-lh.googleusercontent.com/_TgqQftpsZ7MrQEU8pJXJZ_3lFommPqzUj_0dovrHmVhp5NVTud6sbVEHxkVFRJzxn6H',
        flipkart: 'https://cdn.grabon.in/gograbon/images/merchant/1653477064516/flipkart-health-plus-logo.jpg',
        pulseplus: 'https://aniportalimages.s3.amazonaws.com/media/details/pulsepluspiximpov23jkgh_8zvoiRv.jpg',
        tabletshablet: 'https://www.tabletshablet.com/wp-content/uploads/2020/09/TBS_logo.jpg',
        healthmug: 'https://static.oxinis.com/healthmug/image/healthmug/healthmuglogo-192.png',
        myupchar: 'https://image.myupchar.com/8910/original/jobs-in-myupchar-delhi-healthcare-healthtech-techjobs-content-doctor-marketing.jpg',

    }

    if (req.body.medlink.includes('apollo')) {
        final.push(imageLogos['apollo']);
    } else if (req.body.medlink.includes('netmeds')) {
        final.push(imageLogos['netmeds']);
    } else if (req.body.medlink.includes('pharmeasy')) {
        final.push(imageLogos['pharmeasy']);
    } else if (req.body.medlink.includes('healthskool')) {
        final.push(imageLogos['healthskool']);
    } else if (req.body.medlink.includes('pasumai')) {
        final.push(imageLogos['pasumai']);
    } else if (req.body.medlink.includes('flipkart')) {
        final.push(imageLogos['flipkart']);
    } else if (req.body.medlink.includes('pulseplus')) {
        final.push(imageLogos['pulseplus']);
    } else if (req.body.medlink.includes('tabletshablet')) {
        final.push(imageLogos['tabletshablet']);
    } else if (req.body.medlink.includes('healthmug')) {
        final.push(imageLogos['healthmug']);
    } else if (req.body.medlink.includes('myupchar')) {
        final.push(imageLogos['myupchar']);
    }
    res.render(__dirname + '/mediToSite', { final: final });

});


app.get('/medname', async (req, res) => {
    // Insert Login Code Here

    const final = []

    const l = (req.query['q']);
    var urlForPe = `https://pharmeasy.in/search/all?name=${l}`;
    var urlForAp = `https://www.apollopharmacy.in/search-medicines/${l}`;

    extractMedNamesFromApollo = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            // BreadCrumb_peBreadCrumb__2CyhJ
            $('.ProductCard_pdHeader__ETKkp').map((i, elm) => {
                if ($(elm).find(".ProductCard_productName__f82e9").text().includes('Apollo')) {

                } else {
                    final.push({
                        name: $(elm).find(".ProductCard_productName__f82e9").text(),
                        img: $(elm).find('img').attr('src'),
                    })
                }
            })
            final.sort();
            final.push(req.query['q']);
            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            console.log(error);
            return {};
        }
    };
    extractMedNamesFromPharmeasy = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)
            const $ = cheerio.load(data);
            // console.log(data)
            // console.log(final);
            $('.Search_medicineLists__hM5Hk').map((i, elm) => {
                final.push({
                    name: $(elm).find('.ProductCard_medicineName__8Ydfq').text(),
                    img: (($(elm).find('.ProductCard_medicineImgDefault__Q8XbJ noscript').html()).split('src="')[1]).split('"')[0],
                })
            });





        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);
            final.push({
                name: "No Products Found",
            });


        }
    };

    await Promise.all([extractMedNamesFromApollo(urlForAp), extractMedNamesFromPharmeasy(urlForPe)])

    // final.sort();
    // console.log(final)
    final.push(req.body.pin);
    final.push(req.body.foodItem);
    // return final;
    res.send(final)
    // res.render(__dirname + '/medDetails', { final: final });
});

app.get('/med', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log();

    const l = (req.query['q']);
    var urlForPe = `https://pharmeasy.in/search/all?name=${l}`;
    var urlForAp = `https://www.apollopharmacy.in/search-medicines/${l}`;

    extractMedNamesFromApollo = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            // BreadCrumb_peBreadCrumb__2CyhJ
            $('.ProductCard_pdHeader__ETKkp').map((i, elm) => {
                if ($(elm).find(".ProductCard_productName__f82e9").text().includes('Apollo')) {

                } else {
                    final.push({
                        name: $(elm).find(".ProductCard_productName__f82e9").text(),
                        img: $(elm).find('img').attr('src'),
                    })
                }
            })
            final.sort();
            final.push(req.query['q']);
            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            console.log(error);
            return {};
        }
    };
    extractMedNamesFromPharmeasy = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)
            const $ = cheerio.load(data);
            // console.log(data)
            // console.log(final);
            $('.Search_medicineLists__hM5Hk').map((i, elm) => {
                final.push({
                    name: $(elm).find('.ProductCard_medicineName__8Ydfq').text(),
                    img: (($(elm).find('.ProductCard_medicineImgDefault__Q8XbJ noscript').html()).split('src="')[1]).split('"')[0],
                })
            });





        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);
            final.push({
                name: "No Products Found",
            });


        }
    };

    await Promise.all([extractMedNamesFromApollo(urlForAp), extractMedNamesFromPharmeasy(urlForPe)])

    // final.sort();
    console.log(final)
    final.push(req.body.pin);
    final.push(req.body.foodItem);

    res.render(__dirname + '/medDetails', { final: final });
});

app.post('/products', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log(req.body.foodItem)
    urlForPe = `https://www.pulseplus.in/products/${req.body.foodItem}`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            var count = 0;
            // BreadCrumb_peBreadCrumb__2CyhJ
            try {

                $('.col-sm-4 a').map((i, elm) => {
                    // if(count<100){

                    final.push({
                        name: $(elm).text(),
                        link: 'https://www.pulseplus.in' + $(elm).attr('href')
                    });
                    count++;
                    // }
                })

            } catch (e) {
                console.log(e);
            }
            // final.sort();
            // final.push(req.body.pin);
            // final.push(req.body.foodItem);
            // console.log(final)

        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.render(__dirname + '/charMedSearch', { final: final });
});

app.post('/bookdoc', async (req, res) => {
    // Insert Login Code Here

    const final = []
    // console.log(req.body.foodItem)
    urlForPe = `https://www.apollo247.com/specialties`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);

            console.log($.html());
            const specialties_img = []//detailed description
            const specialties_link = []//detailed description
            const specialties_category = []//detailed description
            const specialties_reason = []//detailed description
            const specialties_type = []//detailed description
            // const descr = [];

            $('.Specialties_specialityLogo__3ksS8 img').map((i, elm) => {
                specialties_img.push($(elm).attr('src')); //image
            })


            $('.Specialties_spContent__3exhw').map((i, elm) => {
                specialties_category.push($(elm).find('div').first().text());
                specialties_reason.push($(elm).find('.Specialties_specialityDetails__2wrMe').text());
                specialties_type.push($(elm).find('.Specialties_symptoms__1mIse').text());
            })


            final.push({
                specialties_img: "https://prodaphstorage.blob.core.windows.net/specialties/ee249e8a-950a-489c-8a33-8846889831f5.jpg",
                specialties_category: "Dermatology",
                specialties_link: "https://www.apollo247.com/specialties/dermatology",
                specialties_reason: "Specialists for skin and hair treatments",
                specialties_type: "Rashes, Pimples, Acne, Hairfall, Dandruff",
            })
            final.push({
                specialties_img: "https://newassets.apollo247.com/specialties/ic_general_medicine.png",
                specialties_category: "General Physician/ Internal Medicine",
                specialties_link: "https://www.apollo247.com/specialties/general-physician-internal-medicine",
                specialties_reason: "Managing acute medical conditions",
                specialties_type: "Typhoid, Abdominal Pain, Migraine, Infections",
            })
            final.push({
                specialties_img: "https://newassets.apollo247.com/specialties/ic_paediatrics.png",
                specialties_category: "Paediatrics",
                specialties_link: "https://www.apollo247.com/specialties/paediatrics",
                specialties_reason: "Specialists to care and treat children",
                specialties_type: "Constipation, Puberty, Nutrition, Autism",
            })

            for (var i = 0; i < specialties_type.length; i++) {
                final.push({
                    specialties_img: specialties_img[i],
                    specialties_category: specialties_category[i],
                    specialties_link: "https://www.apollo247.com/specialties/" + ((((specialties_category[i].replaceAll('/', '-')).replaceAll(',', '')).replaceAll('&', 'and')).replaceAll(' ', '-')),
                    specialties_reason: specialties_reason[i],
                    specialties_type: specialties_type[i],
                })
            }
            console.log(final);

        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.render(__dirname + '/orderDocOnline', { final: final });
});

app.get('/getOffers', async (req, res) => {
    // console.log(req.body.chemName)
    var final = await getOffersOfNetmeds();
    res.send(final);
});

app.get('/getNearbyChemistData', async (req, res) => {
    // Insert Login Code Here

    const final = []


    urlForPe = `https://www.bing.com/search?q= chemists in ${req.query['chemCity']}  ${req.query['chemPin']} `;
    extractdoe = async (url) => {
        try {
            // Fetching HTML

            const browser = await puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ]
            });;
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            const data = await page.evaluate(() => document.querySelector('*').outerHTML);
            await browser.close();

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            const chemist_name = [];
            const chemist_direction = [];
            const chemist_status = [];
            const chemist_addr = [];

            final.push({ map_img: $('#mv_baseMap').attr('src') });

            $('.lc_content h2').map((i, elm) => {
                chemist_name.push($(elm).text()); //gtext form bing for maps
            })
            $('.lc_content').map((i, elm) => {
                chemist_addr.push($(elm).find('.b_factrow:nth-child(3)').text()); //gtext form bing for maps
            })

            $('a[aria-label="directions"]').map((i, elm) => {
                chemist_direction.push($(elm).attr('href')); //gtext form bing for maps
            })

            $('.lc_content').map((i, elm) => {
                chemist_status.push($(elm).find('.b_factrow:nth-child(4)').text())
            })



            for (var i = 0; i < chemist_name.length; i++) {
                final.push({
                    chemist_name: chemist_name[i],
                    chemist_direction: `https://www.google.com/maps/dir//${chemist_name[i]} in ${req.query['chemCity']} ${req.query['chemPin']}`,
                    chemist_status: chemist_status[i],
                    chemist_addr: chemist_addr[i],
                })
            }
            final.push($('.b_ilhTitle').text())
        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.send(final);
});

app.post('/shops', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log(req.body.foodArea)
    console.log(req.body.foodItem)
    urlForPe = `https://www.bing.com/search?q=10 chemist shops%20in%20%20mumbai%20400007`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            console.log($.html())
            const chemist_name = [];
            const chemist_direction = [];
            const chemist_status = [];

            final.push({ map_img: $('#mv_baseMap').attr('src') });

            $('.lc_content h2').map((i, elm) => {
                chemist_name.push($(elm).text()); //gtext form bing for maps
            })

            $('a[aria-label="directions"]').map((i, elm) => {
                chemist_direction.push($(elm).attr('href')); //gtext form bing for maps
            })

            $('.opHours>span>span').map((i, elm) => {
                chemist_status.push($(elm).text()); //gtext form bing for maps
            })



            for (var i = 0; i < chemist_name.length; i++) {
                final.push({
                    chemist_name: chemist_name[i],
                    chemist_direction: "https://bing.com" + chemist_direction[i],
                    chemist_status: chemist_status[i],
                })
            }
            console.log(final)
        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.render(__dirname + '/shopsnearme', { final: final });
});

app.post('/doclist', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log(req.body.foodItem)
    const docUrl = req.body.foodItem;
    // urlForPe = `https://www.apollo247.com/specialties`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            // console.log($.html())


            const doc_img = []//detailed description
            const doc_link = []//detailed description
            const doc_name = []//detailed description
            // const doc_desc = []//detailed description
            const doc_price = []//detailed description
            const doc_avail = []//detailed description
            const final = [];
            // const descr = [];

            try {
                $('.MuiAvatar-img').map((i, elm) => {
                    doc_img.push($(elm).attr('src')); //image
                })

                $('.jss192>a').map((i, elm) => {
                    doc_link.push($(elm).attr('href')); //link
                })

                $('.MuiAvatar-img').map((i, elm) => {
                    doc_name.push($(elm).attr('alt')); //
                })

                // $('.jss193 .jss199').map((i, elm) => {
                //     doc_desc.push($(elm).find('h2').text() + " " + $(elm).find('span').text() ); //
                //   })

                $('.jss216 span').map((i, elm) => {
                    doc_price.push($(elm).text()); //
                })


                $('.jss227 p').map((i, elm) => {
                    doc_avail.push($(elm).text()); //
                })
            } catch (e) {
                console.log(e);
            }

            for (var i = 0; i < doc_img.length; i++) {
                final.push({
                    doc_name: doc_name[i],
                    doc_img: doc_img[i],
                    //   doc_desc:doc_desc[i],
                    doc_price: doc_price[i],
                    doc_avail: doc_avail[i],
                    doc_link: "https://www.apollo247.com" + doc_link[i],
                })
            }

            console.log(final);

            res.render(__dirname + '/docOnlineList', { final: final });
        } catch (error) {
            return {};
        }
    };
    await extractdoe(docUrl);
});

app.post('/description', async (req, res) => {
    // Insert Login Code Here

    const final = []
    const l = (req.query['q']);
    url = req.body.foodLink;


    extractDescFromApollo = async (url) => {
        try {
            // Fetching HTML

            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            // console.log($.html())



            const z = []//detailed description
            const x = [];
            const descr = [];
            $('.ProductDetailsGeneric_descListing__w3wG3 h2').map((i, elm) => {
                z.push($(elm).text());
            })

            $('.ProductDetailsGeneric_descListing__w3wG3 div').map((i, elm) => {
                x.push($(elm).text());
                //  console.log('https://www.pulseplus.in'+$(elm).attr('href'));                        
            })

            for (var i = 0; i < x.length; i++) {
                descr.push({
                    'data': z[i],
                    'res': x[i]
                });
            }

            console.log(descr)
            const y = [];
            var temp, temp2;
            $('.PdpFaq_panelRoot__3xR9g').map((i, elm) => {
                temp = $(elm).text().split('?')[0];
                temp2 = $(elm).text().split('?')[1];
                y.push({
                    heading: temp,
                    data: temp2
                });
            });

            final.push({
                desc: descr,
                faq: y,
            });












            url = url.split('?')[0];
            // url="https://apollopharmacy.in"+url;
            console.log('got it->' + url);

            // var a = JSON.parse($('#__NEXT_DATA__').text());
            // var fa = a['props']['pageProps']['productDetails']['similar_products'];
            // if (!fa) {
            //     fa = a['props']['pageProps']['productDetails'];
            // }


            // if (fa.length > 0) {
            //     for (var i = 0; i < fa.length; i++) {
            //         final.push({
            //             subsname: fa[i]['name'],
            //             subsprice: fa[i]['price'],
            //             subsImgLink: "https://newassets.apollo247.com/pub/media" + fa[i]['image'],
            //         })
            //     }

            // } else {
            //     fa = a['props']['pageProps']['productDetails']['productSubstitutes']['products'];
            //     for (var i = 0; i < fa.length; i++) {
            //         final.push({
            //             subsname: (fa[i]['name']),
            //             subsprice: (fa[i]['price']),
            //             subsImgLink: ("https://newassets.apollo247.com/pub/media" + fa[i]['image']),
            //         })
            //     }
            // }
            // final.push(url)




            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            // console.log(error);
            return {};
        }
    };



    urlForYtVideo = `https://in.video.search.yahoo.com/search?p=${l}+medicine+site:youtube.com&fr=sfp`;

    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            const vname = [], vlink = [], vimglink = [];
            $('.v-meta h3').each(function (i, elm) {
                vname.push($(elm).text()) // for name 
            });
            $('.results li a').each(function (i, elm) {
                vlink.push($(elm).attr('data-rurl')) // for name 
            });
            $('.fill img').each(function (i, elm) {
                vimglink.push($(elm).attr('src')) // for name 
            });
            // BreadCrumb_peBreadCrumb__2CyhJ
            console.log(vname)
            try {
                for (var i = 0; i < 3; i++) {

                    final.push({
                        videoname: vname[i],
                        videolink: vlink[i],
                        videoImgLink: vimglink[i],
                    });
                }


            } catch (e) {
                console.log(e);
            }
            final.push({ nameOfMed: l });
            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            console.log(error);
            return {};
        }
    };

    await extractDescFromApollo(url);
    await extractdoe(urlForYtVideo);
    // console.log(final)


    res.send(final);

});

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/name.html');
// });

// extractLinkFromGoogle = async(url) => {
//     try {
//         // Fetching HTML
//         const { data } = await axios.get(url)

//         // Using cheerio to extract <a> tags
//         const $ = cheerio.load(data);


//         rawUrl = $('.kCrYT>a').first().attr('href');
//         url = rawUrl.split("/url?q=")[1].split("&")[0];
//         console.log('Extracting url: ', url);

//         return url;

//     } catch (error) {
//         // res.sendFile(__dirname + '/try.html');
//         // res.sendFile(__dirname + '/error.html');
//         console.log(error);
//         return 0;
//     }
// };

extractLinkFromBing = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)
        // console.log(typeof(data));
        // console.log(data)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        const rawUrl = $('li[class=b_algo] h2 a').first().attr('href');
        console.log(rawUrl);
        if (rawUrl != undefined) {
            return rawUrl
        } else {
            return '';
        }
        // url = rawUrl.split("/url?q=")[1].split("&")[0];
        // console.log('Extracting url: ', url);


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

extractLinkFromyahoo = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)
        // console.log(typeof(data));
        // console.log(data)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        const rawUrl = $('li .compTitle h3 a').first().attr('href');
        console.log(rawUrl);
        if (rawUrl != undefined) {
            return rawUrl
        } else {
            return '';
        }

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return 0;
    }
};



getOffersOfPharmeasy = async () => {

    const { data } = await axios.get(`https://pharmeasy.in/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offer = [];
    var count = 0;
    $('.OffersCard_container__L_jzu').map((i, elm) => {
        if (count < 2) {
            offer.push({
                offer: $(elm).find('.OffersCard_offerInnerContainer__r_zuK').text(),
                code: ($(elm).find('.OffersCard_code__bTCOL').text()),
            });
            count++;
        }
    });
    return offer;
}

function getDeliveryChargeForPharmeasy(totalMedPrice){
    var dc=0; 
    if (totalMedPrice < 250) {
            dc = 149;
        } else if (totalMedPrice >= 250 && totalMedPrice < 500) {
            dc = 99;
        } else if (totalMedPrice >= 500 && totalMedPrice < 699) {
            dc = 25;
        } else if (totalMedPrice >= 699) {
            dc = 0;
        }
        return dc;
}
extractDataOfPharmEasy = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        // const offer =await getOffersOfPharmeasy();
        const $ = cheerio.load(data, { xmlMode: false });

        var a = JSON.parse($('script[type=application/json]').text());


        var dc = '';


     

        try {
            var imgurl = a['props']['pageProps']['productDetails']['damImages'][0]['url'];
        } catch (e) {
            imgurl = "";
        }
        return {
            name: 'PharmEasy',
            item: a['props']['pageProps']['productDetails']['name'].substring(0,30),
            link: url,
            imgLink: imgurl,
            price: a['props']['pageProps']['productDetails']['costPrice'],
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(a['props']['pageProps']['productDetails']['costPrice']),
        };


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);

        console.log(error);
        return {};
    }
};

extractDataOfFlipkart = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var dc = '';

        if ($('.custAddCrtBtn').attr('offerprice') < 99) {
            dc = 75;
        } else if ($('.custAddCrtBtn').attr('offerprice') >= 100 && $('.custAddCrtBtn').attr('offerprice') < 299) {
            dc = 49;
        } else if ($('.custAddCrtBtn').attr('offerprice') >= 300 && $('.custAddCrtBtn').attr('offerprice') < 499) {
            dc = 19;
        } else if ($('.custAddCrtBtn').attr('offerprice') >= 500) {
            dc = 0;
        }

        return {
            name: 'Flipkart Health+',
            item: ($('.custAddCrtBtn').attr('displayname')).substring(0,30),
            link: url,
            imgLink: $('#med_dtl_img').attr('src'),
            price: $('.custAddCrtBtn').attr('offerprice'),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat($('.custAddCrtBtn').attr('offerprice')) + parseFloat(dc),

        };
    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);

        console.log(error);
        return {};
    }
};

function getDeliveryChargeForNetmeds(totalMedPrice){
  var dc=0;
    if (totalMedPrice < 250) {
        dc = 99;
    } else if (totalMedPrice >= 250 && totalMedPrice < 1000) {
        dc = 29;
    } else if (totalMedPrice > 1000) {
        dc = 0;
    }
    return dc;
}
getOffersOfNetmeds = async () => {
    const { data } = await axios.get(`https://netmeds.com/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    const coupon = [], offerDet = [];

    $('.rOffer-Block .offer_sub_img').map((i, elm) => {
        offerDet.push($(elm).attr('alt')); //details
    });
    $('.rOffer-Block .offer-coupon').map((i, elm) => {
        coupon.push($(elm).text());
    });
    for (var i = 0; i < 2; i++) {
        offers.push({
            offer: offerDet[i],
            code: coupon[i],
        })
    }
    return offers;
}
extractDataOfNetMeds = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url);

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        var dc = '';

        if ($('#last_price').attr('value') < 250) {
            dc = 99;
        } else if ($('#last_price').attr('value') >= 250 && $('#last_price').attr('value') < 1000) {
            dc = 29;
        } else if ($('#last_price').attr('value') > 1000) {
            dc = 0;
        }


        return {
            name: 'NetMeds',
            item: $('.product-detail').text().substring(0,30),
            link: url,
            imgLink: $('.largeimage img').attr('src'),
            price: $('#last_price').attr('value'),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat($('#last_price').attr('value')) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

function getDeliveryChargeForApollo(totalMedPrice){
    var dc=0;
    if (totalMedPrice < 300) {
        dc = 99;
    } else if (totalMedPrice >= 300 && totalMedPrice < 500) {
        dc = 69;
    } else if (totalMedPrice >= 500 && totalMedPrice < 800) {
        dc = 25;
    } else if (totalMedPrice >= 800) {
        dc = 0;
    }
    return dc;
}
getOffersOfApollo = async () => {
    const { data } = await axios.get(`https://www.apollopharmacy.in/special-offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    const coupon = [], offerDet = [];
    $('.OffersCard_title__6QWzu').map((i, elm) => {
        offerDet.push($(elm).text());

    });
    $('.OffersCard_detailMainList__pLknV').map((i, elm) => {
        coupon.push($(elm).find('.OffersCard_dmtList__VMxN6').text());
    });

    for (var i = 0; i < 2; i++) {
        offers.push({
            offer: offerDet[i],
            code: coupon[i],
        })
    }

    return offers;
}
extractDataOfApollo = async (url, final, presReq) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlMode: false });
        const apolloData = JSON.parse($('#__NEXT_DATA__').text());
        console.log(url);

        console.log($('.PdpWeb_subTxt__Soj3p').text());
        var a = JSON.parse($('#__NEXT_DATA__').text());
        var fa = a['props']['pageProps']['productDetails']['similar_products'];
        if (!fa) {
            fa = a['props']['pageProps']['productDetails'];
        }

        if (apolloData['props']['pageProps']['productDetails']['productdp'][0]['is_prescription_required'] == 1) {
            presReq[0] = "Yes";
        }
        //    console.log(fa);

        try {

            if (fa.length > 0) {
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: fa[i]['name'],
                        subsprice: fa[i]['price'],
                        subsImgLink: "https://newassets.apollo247.com/pub/media" + fa[i]['image'],
                    })
                }

            } else {
                fa = a['props']['pageProps']['productDetails']['productSubstitutes']['products'];
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: (fa[i]['name']),
                        subsprice: (fa[i]['price']),
                        subsImgLink: ("https://newassets.apollo247.com/pub/media" + fa[i]['image']),
                    })
                }
            }

        } catch (error) {
            //if subs are not available , then go for crossell products 
            try {
                fa = a['props']['pageProps']['productDetails']['crosssell_products'];
                console.log(fa);
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: (fa[i]['name']),
                        subsprice: (fa[i]['price']),
                        subsImgLink: ("https://newassets.apollo247.com/pub/media" + fa[i]['image']),
                    })
                }
            } catch (e) {
                final.push({
                    subsname: "No Subs",
                    subsprice: "",
                    subsImgLink: "",
                })
            }
        }

        var t, m;
        const offers = [];
        //  await getOffersOfApollo(url,final);

        //  await Promise.all([getOffersOfApollo()])
        //         .then(await axios.spread(async (...responses) => {
        //             // console.log(...responses);
        //             offers.push(responses[0])
        //             // final.push(responses[1])

        //             // await extractSubsfApollo(item[7], final);
        //         }))
        console.log("Done");



        m = apolloData.props.pageProps.productDetails.productdp[0].special_price;
        if (!m) {
            m = apolloData.props.pageProps.productDetails.productdp[0].price;
        }
        console.log("price from apollo-> " + $('.MedicineInfoWeb_medicinePrice__HPf1s').text())
        var dc = '';

        if (m < 300) {
            dc = 99;
        } else if (m >= 300 && m < 500) {
            dc = 69;
        } else if (m >= 500 && m < 800) {
            dc = 25;
        } else if (m >= 800) {
            dc = 0;
        }

        return {
            name: 'Apollo',
            item: apolloData.props.pageProps.productDetails.productdp[0].name,
            link: url,
            imgLink: 'https://newassets.apollo247.com/pub/media' + apolloData.props.pageProps.productDetails.productdp[0].image[0],
            price: m,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(m) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

FastextractDataOfApollo = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlMode: false });
        const apolloData = JSON.parse($('#__NEXT_DATA__').text());
        // console.log(url);

        m = apolloData.props.pageProps.productDetails.productdp[0].special_price;
        if (!m) {
            m = apolloData.props.pageProps.productDetails.productdp[0].price;
        }

        console.log("Generic Option For"+apolloData.props.pageProps.productDetails.productdp[0].name+" ->  "+$('.PdpWeb_subTxt__Soj3p').text());
        var a = JSON.parse($('#__NEXT_DATA__').text());
        var fa = a['props']['pageProps']['productDetails']['similar_products'];
        if (!fa) {
            fa = a['props']['pageProps']['productDetails'];
        }

        
        //    console.log(fa);

        //  await getOffersOfApollo(url,final);

        //  await Promise.all([getOffersOfApollo()])
        //         .then(await axios.spread(async (...responses) => {
        //             // console.log(...responses);
        //             offers.push(responses[0])
        //             // final.push(responses[1])

        //             // await extractSubsfApollo(item[7], final);
        //         }))



       
        // console.log("price from apollo-> " + $('.MedicineInfoWeb_medicinePrice__HPf1s').text())
        var dc = '';

        if (m < 300) {
            dc = 99;
        } else if (m >= 300 && m < 500) {
            dc = 69;
        } else if (m >= 500 && m < 800) {
            dc = 25;
        } else if (m >= 800) {
            dc = 0;
        }

        return {
            name: 'Apollo',
            item: apolloData.props.pageProps.productDetails.productdp[0].name.substring(0,30),
            link: url,
            imgLink: 'https://newassets.apollo247.com/pub/media' + apolloData.props.pageProps.productDetails.productdp[0].image[0],
            price: m,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(m) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

extractDataOfHealthmug = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlParse: false });
        // console.log($.html());
        var healthMugData;
        $("script[type=application/ld+json]").map(function (i, v) {
            if (i == 1) {
                healthMugData = JSON.parse($(this).text());
            }
        });

        var dc = '';

        if (healthMugData.offers.price < 499) {
            dc = 50;
        } else if (healthMugData.offers.price >= 500) {
            dc = 0;
        }


        return {
            name: 'Healthmug',
            item: healthMugData.name,
            link: url,
            imgLink: healthMugData.image,
            price: healthMugData.offers.price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(healthMugData.offers.price) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForHealthskool(totalMedPrice){
    var dc=0;
    
    if (totalMedPrice <= 999) {
        dc = 40;
    } else if (totalMedPrice > 999) {
        dc = 0;
    }
    return dc;
}
getOffersOfHealthskoolpharmacy = async () => {
    const { data } = await axios.get(`https://www.healthskoolpharmacy.com/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    const coupon = [], offerDet = [];
    $('h2').map((i, elm) => {
        offerDet.push($(elm).text());

    });
    $('h3').map((i, elm) => {
        coupon.push($(elm).text());
    });

    for (var i = 0; i < 2; i++) {
        offers.push({
            offer: offerDet[i],
            code: coupon[i],
        })
    }

    return offers;
}
extractDataOfHealthskoolpharmacy = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlParse: false });
        // console.log($.html());
        var Curr_price = $('.product-price').text();
        Curr_price = Curr_price.split('₹')[1];

        var dc = '';

        if (Curr_price <= 999) {
            dc = 40;
        } else if (Curr_price > 999) {
            dc = 0;
        }


        return {
            name: 'HealthsKool Pharmacy',
            item: $('.product-title').text().substring(0,30),
            link: url,
            imgLink: $('.product-info .image a').first().attr('href'),
            price: Curr_price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(Curr_price) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};





extractDataOf3Meds = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        const offers = [];
        $('.AdditionalOffers ul li').map((i, elm) => {
            offers.push($(elm).text());
        });
        var p = $('.actualrate').text().trim();
        p = p.split('Rs.')[1];

        return {
            name: '3 Meds',
            item: $('h1').text().substring(0,30),
            link: url,
            imgLink: $('.productimg img').first().attr('src'),
            price: p,
            offer: offers,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};
extractDataOfTata = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url);

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var t, m;
        // console.log($.html());

        if ($('.container-fluid-padded h1').text()) {
            t = $('.container-fluid-padded h1').text();

        } else if ($('.style__pro-title___3G3rr').first().text()) {

            t = $('.style__pro-title___3G3rr').first().text();
        } else if ($('.style__pro-title___3zxNC').first().text()) {
            t = $('.style__pro-title___3zxNC').first().text();
        } else if ($('.style__pro-title___2QwJy').first().text()) {
            t = $('.style__pro-title___2QwJy').first().text();
        } else if ($('.PriceWidget__selectedContainer__cCRai .marginTop-8').first().text()) {
            t = $('.PriceWidget__selectedContainer__cCRai .marginTop-8').first().text();
        } else {
            t = $('h1[class=col-6]').first().text()
        }
        // t = $('.style__pro-title___3G3rr').first().text();


        if ($('.Price__price__22Jxo').text()) {

            m = $('.Price__price__22Jxo').text();

        } else if ($('.style__price-tag___B2csA').first().text()) {

            m = $('.style__price-tag___B2csA').first().text();

        } else if ($('.style__product-pricing___1OxnE').first().text()) {

            m = $('.style__product-pricing___1OxnE').first().text();

        } else if ($('.style__price-tag___cOxYc').first().text()) {
            m = $('.style__price-tag___cOxYc').first().text();
        } else {
            m = $('.l3Regular').first().text();
        }

        console.log(m, "===", t)
        if (m != '') {
            console.log(m);
            if (m.includes('off')) {


                if (m.includes("MRP")) {
                    m = m.split("MRP")[0];
                }
                if (m.includes('₹')) {
                    m = m.split("₹")[1];
                }
            } else if (m.includes('MRP')) {
                m = m.split("MRP")[1].trim();
                if (m.includes('₹')) {
                    m = m.split('₹')[1];
                }
            } else {
                m = m;
            }
        }
        console.log(m, "===", t)
        if (t == "" && m == "") {
            t = "Not Available";
            m = "Not Available";
        }

        return {
            name: 'Tata 1mg',
            item: t,
            link: url,
            price: m,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};


function getDeliveryChargeForPulsePlus(totalMedPrice){
    var dc=0;
    if (totalMedPrice < 999) {
        dc = 50;
    } else if (totalMedPrice >= 1000) {
        dc = 15;
    }

    return dc;
}
getNameOfPulsePlus = async (url) => {
    const { data } = await axios.get(url)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    var temp;
    // BreadCrumb_peBreadCrumb__2CyhJ

    $('.col-sm-4 a').map((i, elm) => {
        temp = "https://www.pulseplus.in/products" + $(elm).text();
    })
    return temp;
}

extractDataOfmedplusMart = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        // const offers = [];
        // $('.mb-1 label').each(function (i, elm) {
        //     offers.push({offer:$(elm).text()});
        // })
        // console.log(offers);


        var t = $('span[property=price]').attr('content');

        var dc;
        if (t < 999) {
            dc = 50;
        } else if (t >= 1000) {
            dc = 15;
        }

        return {
            name: 'PulsePlus',
            item: $('#divProductTitle>h1').text().substring(0,30),
            link: url,
            imgLink: $('.profile-picture').attr('src'),
            // price: $('.DrugPriceBox__price___dj2lv').text(),
            // price: $('span[property=priceCurrency]').text()
            price: t,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(t) + parseFloat(dc),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

function getDeliveryChargeForMyUpChar(totalMedPrice){
    var dc=0;
    if (totalMedPrice < 499) {
        dc = 49;
    } else if (totalMedPrice > 500) {
        dc = 0;
    }

    return dc;
}
getOffersOfMyUpChar = async () => {
    const { data } = await axios.get(`https://www.myupchar.com/en/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    $('.offers-bx h2').each(function (i, elm) {
        offers.push({ offer: $(elm).text() });
    });
    return offers;
}
extractDataOfMyUpChar = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        // const offers = await getOffersOfMyUpChar();

        // console.log($.html());
        var a = $('.head h1').first().text();
        if (!a) {
            a = $('#med_details h1').first().text();
        }
        // console.log(a);
        var b = $('.price_txt .txt_big').first().text();
        if (!b) {
            b = $('.pack_sp').first().text();
        }
        if (!b) {
            b = $('.pack_mrp').first().text();
        }
        // console.log(b);
        if (b != '') {
            if (b.includes('₹')) {
                b = b.split('₹')[1];
            }
        }

        var dc = '';

        if (b < 499) {
            dc = 49;
        } else if (b > 500) {
            dc = 0;
        }


        return {
            name: 'myupchar',
            item: a.substring(0,30),
            link: url,
            imgLink: $('.image_slide').attr('src'),
            price: b,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(b) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForTabletShablet(totalMedPrice){
    var dc=0;

    if (totalMedPrice < 500) {
        dc = 68.88;
    } else if (totalMedPrice >= 500 && totalMedPrice < 1000) {
        dc = 50.40;
    } else if (totalMedPrice >= 1000) {
        console.log('hie')
        dc = 0;
    }
    return dc;
}
extractDataOfOBP = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());
        var p = $('.price ins bdi').first().text();
        if (!p) {
            p = $('.price').first().text()
        }
        if (p) {
            if (p.includes(" – ")) {
                console.log(p)
                p = p.split(" – ")[0];
                console.log(p)
            }
        }
        if (p) {
            if (p.includes('₹')) {
                p = p.split('₹')[1];
            }
            if (p.includes(',')) {
                p = p.replace(',', '');
            }
        }

        //     const offers=[];
        //     var count=0;
        //     $('.offer-item').map((i, elm) => {
        //         if(count<2){
        //             offers.push({
        //                 offer:$(elm).text(),
        //             });
        //            count++;
        //         }
        //   });
        var dc = '';

        console.log(p)
        console.log(typeof (parseFloat(p)))
        if (parseFloat(p) < 500) {
            dc = 68.88;
        } else if (parseFloat(p) >= 500 && parseFloat(p) < 1000) {
            dc = 50.40;
        } else if (parseFloat(p) >= 1000) {
            console.log('hie')
            dc = 0;
        }

        return {
            name: 'Tablet Shablet',
            item: $('.entry-title').text().substring(0,30),
            link: url,
            imgLink: $('.jws-gallery-image img').attr('src'),
            price: p,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(p) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

extractDataOfPP = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var dataOfPP = {};
        $("script[type=application/ld+json]").map(function (i, v) {
            dataOfPP = JSON.parse($(this).text());
        });

        var dc = '';

        if (dataOfPP.offers.price < 1000) {
            dc = 50;
        } else if (dataOfPP.offers.price >= 1000) {
            dc = 0;
        }
        // console.log($.html());

        return {
            name: 'Pasumai Pharmacy',
            item: dataOfPP.name.substring(0,30),
            link: url,
            imgLink: dataOfPP.image,
            price: dataOfPP.offers.price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(dataOfPP.offers.price) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};



extractDataOfEgmedi = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        // console.log($.html());

        return {
            name: 'Egmedi',
            item: $('.product h2').first().text().substring(0,30),
            link: $('.product a').first().attr('href'),
            imgLink: $('.product img').first().attr('src'),
            price: $('.product .price').first().text(),
            offer: '',
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};


function getDeliveryChargeForOgMedPlusMart(totalMedPrice){
    var dc=0;
    return dc;
}
extractDataOfOgMPM = async ( url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        var a=JSON.parse($('script[type="application/ld+json"]:contains("offers")').text());

        return {
            name: 'MedPlusMart',
            item: a["name"].substring(0,30),
            link: url,
            imgLink: a["image"],
            price: parseInt(a["offers"]["mrp"]).toFixed(2),
            offer: '',
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};


extractLinkFromOptimizedyahoo = async (url,medname, ...pharmaNames) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)
        // console.log(data)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());



        var keywords = medname.split(' ');
        var pharmas = [];

      

       
        var resultsA = [],resultsB = [],resultsC = [];
        $('#web ol li h3 a').each(function () {
            var str = $(this).attr('href');
            //dolo 650 mg

            // console.log(str);

            if (str.includes(pharmaNames[0])) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsA.push({ plink: str, point: count });
                
            }else if(str.includes(pharmaNames[1])){
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsB.push({ plink: str, point: count });
            }else if(str.includes(pharmaNames[2])){ 
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsC.push({ plink: str, point: count });
            }
        })

        resultsA.sort((a, b) => {
            return b.point - a.point;
        });
        resultsB.sort((a, b) => {
            return b.point - a.point;
        });
        resultsC.sort((a, b) => {
            return b.point - a.point;
        });


        const final=[];
        if(resultsA.length>0){
            final.push(resultsA[0]['plink'])
        }else{
            final.push(0)
        }
        if(resultsB.length>0){
            final.push(resultsB[0]['plink'])
        }else{
            final.push(0)
        }
        if(resultsC.length>0){
            final.push(resultsC[0]['plink'])
        }else{
            final.push(0)
        }





        //  console.log(pharmas);
        // for(names in pharmas){

        //      var count=0;
        // for (var i = 0; i < keywords.length; i++) {
        //     if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(pharmas[names])) ){
        //         // results.push(keywords[i]);
        //         count++;
        //         console.log(pharmas[names] + "->" + count);
        //     }
        // }

        // }

        // console.log(rawUrl);
        // if (rawUrl != undefined) {
        //     return rawUrl
        // } else {
        //     return '';
        // }
        return final;
        // url = rawUrl.split("/url?q=")[1].split("&")[0];
        // console.log('Extracting url: ', url);


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return 0;
    }
};


app.get('/FastGetPharmaDataFromLinks', async (req, res) => {
    
    const pharmaLinkArray = req.query['pharmalinks'].split(",");
    // console.log(typeof(req.query['pharmalinks']));
    const pharmaData=[]
    
    pharmaData.push(await Promise.all([FastextractDataOfApollo(pharmaLinkArray[0]), extractDataOfNetMeds( pharmaLinkArray[1]),extractDataOfPharmEasy( pharmaLinkArray[2]),
    extractDataOfHealthskoolpharmacy( pharmaLinkArray[3]), extractDataOfOBP( pharmaLinkArray[4]),extractDataOfmedplusMart( pharmaLinkArray[5]),
    extractDataOfMyUpChar( pharmaLinkArray[6]), extractDataOfPP( pharmaLinkArray[7]),extractDataOfOgMPM(pharmaLinkArray[8])]));
    console.log(pharmaData);
    // res.send(pharmaData);

    res.send(pharmaData);

    
});

app.get('/fastComp', async (req, res) => {
    // Insert Login Code Here



    const nameOfMed = req.query['medname'] + '\n';
    console.log(nameOfMed);
    const presReq = ["No"];

      const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

   const Finallinks= await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
        , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai,nameOfMed, 'myupchar', 'pasumai','medplusmart')])
     



        res.send(Finallinks);

    // await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharHealthmugPasumai,nameOfMed, 'myupchar', 'healthmug', 'pasumai')])
    //     .then(await axios.spread(async (...responses) => {
    //         // console.log(...responses);
    //         const end = performance.now() - start;
    //         console.log(`Execution time: ${end}ms`);

    //         // item.push(responses[0])

    //         console.log(responses[0]);
    //         console.log(responses[1]);
    //         console.log(responses[2]);

    //         // getData(item);
    //     }))


});
app.post('/multiSearch',async(req,res)=>{

    const linkdata=[];
    const start1 = performance.now();
    console.log(typeof(req.body.multiItems));
    if(typeof(req.body.multiItems)=="string"){
        var nameOfMed=req.body.multiItems.split(',');
        if(nameOfMed.length==1){
            linkdata.push(`http://medicomp.in/fastComp?medname=${nameOfMed[0]}`)
        }
    } else{
        if(req.body.multiItems.length>1&&req.body.multiItems.length<6){
        for(mednames in req.body.multiItems){
            linkdata.push(`http://medicomp.in/fastComp?medname=${req.body.multiItems[mednames]}`)
          }
      }else{
        for(var mednames=0;mednames<5;mednames++){
            linkdata.push(`http://medicomp.in/fastComp?medname=${req.body.multiItems[mednames]}`)
          }
      }
   }
    const responses = await axiosParallel(linkdata);
    
    
    
    console.log(responses.length);
    
    
    
    
    const finalMultiPriceData=[];
    for(var i=0;i<responses.length;i++){
        finalMultiPriceData.push(`http://medicomp.in/FastGetPharmaDataFromLinks?pharmalinks=${responses[i]['data']}`)
    }
    // console.log(finalMultiPriceData)
    const pharmaFinaldata = await axiosParallel(finalMultiPriceData);
    console.log(pharmaFinaldata[0].data);

    
    
    //     responses[i]['data']=[].concat(responses[i]['data'][0],responses[i]['data'][1],responses[i]['data'][2]);
    //     console.log(responses[i]['data'])
    
    //     finalMultiPriceData.push( await Promise.all([extractDataOfApollo(responses[i]['data'][0]), extractDataOfNetMeds( responses[i]['data'][1]),extractDataOfPharmEasy( responses[i]['data'][2]),
    //     extractDataOfHealthskoolpharmacy( responses[i]['data'][3]), extractDataOfOBP( responses[i]['data'][4]),extractDataOfmedplusMart( responses[i]['data'][5]),
    //     extractDataOfMyUpChar( responses[i]['data'][6]), extractDataOfHealthmug( responses[i]['data'][7], final, presReq), extractDataOfPP( responses[i]['data'][8])]))
    
    
    
    
    const end1 = performance.now() - start1;
    // const responses = await Promise.all(FinalDataFunc);
    
    const final=[];
    for (var i = 0; i < pharmaFinaldata.length; i++) {
        final.push(pharmaFinaldata[i]['data']);
    }
    console.log(`Execution time for final price scraping: ${end1}ms`);
    res.render(__dirname + '/temptour', { final: final });
    
    
        
});




app.get('/compare', async (req, res) => {
    // Insert Login Code Here



    const nameOfMed = req.query['medname'] + '\n';
    console.log(req.query['medname']);
    const presReq = ["No"];

    // const nameOfMed = req.body.foodItem + '\n';
    // console.log(req.body.foodItem);
    // console.log('Name')
    // try {
    //     let date_ob = new Date();

    //     // current date
    //     // adjust 0 before single digit date
    //     const date = ("0" + date_ob.getDate()).slice(-2);

    //     // current month
    //     const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    //     // current year
    //     const year = date_ob.getFullYear();
    //     const finalDate = date + '/' + month + '/' + year;

    //     const auth = new google.auth.GoogleAuth({
    //         keyFile: "medicompJson.json",
    //         scopes: "https://www.googleapis.com/auth/spreadsheets",
    //     })
    //     const spreadsheetId = "18AFfkHKArlpCqDuBC6yzfXOkTgOzRGmXeq88uhqQqGo";
    //     const client = await auth.getClient();
    //     const googleSheets = google.sheets({ version: "v4", auth: client });

    //     googleSheets.spreadsheets.values.append({
    //             auth,
    //             spreadsheetId,
    //             range: "Sheet1!A:B",
    //             valueInputOption: "USER_ENTERED",
    //             resource: {
    //                 values: [
    //                     [finalDate, nameOfMed]
    //                 ]
    //             },
    //         })
    //         // console.log(metadata);
    // } catch (error) {
    //     console.log({});
    // }



    // fs.appendFile("data.txt", nameOfMed, function(err) {
    //     if (err) {
    //         return console.log(err);
    //     }
    //     console.log("The file was saved!");
    // });
    // https://www.ask.com/web?q=site:apollopharmacy.in%20crocin%20advance+&ad=dirN&o=0
  
    // const urlForPharmEasy = `https://in.search.yahoo.com/search;_ylt=?p=site:pharmeasy.in+${nameOfMed} medicine`;  //*//
    // const urlForNetMeds = `https://in.search.yahoo.com/search;_ylt=?p=site:netmeds.com+${nameOfMed} medicine`;
    // const urlForApollo = `https://in.search.yahoo.com/search;_ylt=?p=site:apollopharmacy.in+${nameOfMed} medicine`;
    // const urlForHealthsKool = `https://in.search.yahoo.com/search;_ylt=?p=site:healthskoolpharmacy.com+${nameOfMed} medicine`;
    // // const urlForHealthmug = `https://www.healthmug.com/search?keywords=${nameOfMed}`;
    // const urlForTata = `https://in.search.yahoo.com/search;_ylt=?p=site:1mg.com+${nameOfMed} medicine`;
    // const urlForOBP = `https://in.search.yahoo.com/search;_ylt=?p=site:tabletshablet.com+${nameOfMed} medicine`;
    // const urlFormedplusMart = `https://in.search.yahoo.com/search;_ylt=?p=site:pulseplus.in+${nameOfMed} medicine`;
    // const urlForMyUpChar = `https://in.search.yahoo.com/search;_ylt=?p=site:myupchar.com+${nameOfMed} medicine`;
    // // const urlFor3Meds = `https://in.search.yahoo.com/search;_ylt=?p=site:3meds.com+${nameOfMed}`
    // const urlForHealthmug = `https://in.search.yahoo.com/search;_ylt=?p=site:healthmug.com+${nameOfMed} medicine`;
    // const urlForPP = `https://in.search.yahoo.com/search;_ylt=?p=site:pasumaipharmacy.com+${nameOfMed} medicine`;
    // const urlForFH = `https://in.search.yahoo.com/search;_ylt=?p=site:healthplus.flipkart.com+${nameOfMed} medicine`;

    const urlForPharmEasy = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=pharmeasy.in`;  //*//
    const urlForNetMeds = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=netmeds.com`;
    const urlForApollo = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=apollopharmacy.in`;
    const urlForHealthsKool = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=healthskoolpharmacy.com`;
    // const urlForHealthmug = `https://www.healthmug.com/search?keywords=${nameOfMed}`;
    const urlForTata = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=1mg.com`;
    const urlForOBP = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=tabletshablet.com`;
    const urlFormedplusMart = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=pulseplus.in`;
    const urlForMyUpChar = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=myupchar.com`;
    // const urlFor3Meds = `https://in.in.search.yahoo.com/search=?p=3meds.com+${nameOfMed}`
    const urlForHealthmug = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=healthmug.com`;
    const urlForPP = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=pasumaipharmacy.com`;
    const urlForFH = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}) medicine&vs=healthplus.flipkart.com`;
    const
        final = [];
    // getLinks = async() => {
    //     for (const item of items) {
    //         // await fetchItem(item)
    //         // if (t != '') {
    //         if (item.includes('netmeds')) {
    //             final.push(
    //                     await extractLinkFromyahoo(item)
    //                 ) // final.push(await extractDataOfNetMeds(t));
    //         } else if (item.includes('1mg')) {

    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )


    //             // final.push(await extractDataOfTata(t));
    //         } else if (item.includes('myupchar')) {
    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )

    //             console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         } else if (item.includes('pharmeasy')) {
    //             // console.log('yes in it');
    //             final.push(

    //                 await extractLinkFromyahoo(item)
    //             )

    //             // console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         } else if (item.includes('pulseplus')) {
    //             // console.log('yes in it');
    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )

    //             // console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         } else if (item.includes('tabletshablet')) {
    //             // console.log('yes in it');
    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )

    //             // console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         }

    //         // if(a!=1){
    //         //     final.push(extractLinkFromGoogle('https://www.google.com/search?q=site:pharmeasy/com'))
    //         // }
    //         // } // linkNames.push(t);
    //     }
    // }
    // await getLinks();
    // console.log(final);
    extractSubsfApollo = async (data, final) => {
        try {
            // Fetching HTML
            // url = url.split('?')[0];
            // url="https://apollopharmacy.in"+url;
            // console.log('got it->' + url);
            // const { data } = await axios.get(url)
            const NameOfSubs = [];
            const PriceOfSubs = [];
            const ImgLinkOfSubs = [];
            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            // console.log($.html());

            var a = JSON.parse($('#__NEXT_DATA__').text());
            var fa = a['props']['pageProps']['productDetails']['similar_products'];


            if (fa.length > 0) {
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: fa[i]['name'],
                        subsprice: fa[i]['price'],
                        subsImgLink: fa[i]['image'],
                    })
                }

            } else {
                fa = a['props']['pageProps']['productDetails']['productSubstitutes']['products'];
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: (fa[i]['name']),
                        subsprice: (fa[i]['price']),
                        subsImgLink: ("https://newassets.apollo247.com/pub/media" + fa[i]['image']),
                    })
                }
            }

            const subs = [];

            var a = JSON.parse($('#__NEXT_DATA__').text());
            var fa = a['props']['pageProps']['productDetails']['similar_products'];


            if (fa.length > 0) {
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: fa[i]['name'],
                        subsprice: fa[i]['price'],
                        subsImgLink: fa[i]['image'],
                    })
                }

            } else {
                fa = a['props']['pageProps']['productDetails']['productSubstitutes']['products'];
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: (fa[i]['name']),
                        subsprice: (fa[i]['price']),
                        subsImgLink: ("https://newassets.apollo247.com/pub/media" + fa[i]['image']),
                    })
                }
            }


            final.push(url)



        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);
            return error;
        }
    };

    const start = performance.now();
    const item = await Promise.all([extractLinkFromyahoo(urlForNetMeds), extractLinkFromyahoo(urlForPharmEasy), extractLinkFromyahoo(urlForOBP),
    extractLinkFromyahoo(urlFormedplusMart), extractLinkFromyahoo(urlForMyUpChar), extractLinkFromyahoo(urlForHealthmug),
    extractLinkFromyahoo(urlForPP), extractLinkFromyahoo(urlForApollo), extractLinkFromyahoo(urlForFH), extractLinkFromyahoo(urlForHealthsKool)])

    const end = performance.now() - start;
    console.log(`Execution time for yahoo: ${end}ms`);

    const start1 = performance.now();
    // const LinkDataResponses = await axiosParallel(item);
    
    const responses = await Promise.all([extractDataOfNetMeds(item[0]), extractDataOfPharmEasy( item[1], presReq),
    extractDataOfOBP( item[2]),
    extractDataOfmedplusMart( item[3]), extractDataOfMyUpChar( item[4]),
    extractDataOfHealthmug( item[5]),
    extractDataOfPP( item[6]), extractDataOfApollo( item[7], final, presReq),
    extractDataOfFlipkart( item[8]), extractDataOfHealthskoolpharmacy( item[9])]);
    
    const end1 = performance.now() - start1;
    console.log(`Execution time for pharmas: ${end1}ms`);
    // const responses = await Promise.all(FinalDataFunc);

    for (var i = 0; i < 10; i++) {
        final.push(responses[i]);
    }
    // final.push(responses[0])
    // final.push(responses[1])
    // final.push(responses[2])
    // final.push(responses[3])
    // final.push(responses[4])
    // final.push(responses[5])
    // final.push(responses[6])
    // final.push(responses[7])
    // final.push(responses[8])
    // final.push(responses[9])


    final.sort((a, b) => a.finalCharge - b.finalCharge); // b - a for reverse sort

    if (presReq[0] == "Yes") {
        final.push(presReq);
    }
    final.push(item[7])
    final.push(nameOfMed)
    console.log(final)

    console.log('Found Everything Sir!..')

    // const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // var dateOfSearch=new Date().getDay();
    // dateOfSearch=days[dateOfSearch];


    // const MedQuery="INSERT INTO MedicineSearchDetails (SearchTime,MedicineName) VALUES ?";
    // var values=[
    //     [`${dateOfSearch}`,`${nameOfMed}`]
    // ]
    // connection.query(MedQuery,[values],function(err,results){
    //   if(err) throw err;
    //   console.log("Records Inserted for "+nameOfMed);
    // })




    res.render(__dirname + '/tour', { final: final });



});

const port = process.env.PORT || 2000 // Port we will listen on

// Function to listen on the port
app.listen(port, () => console.log(`This app is listening on port ${port}`));