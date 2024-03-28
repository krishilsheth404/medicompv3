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

const stringSimilarity = require('string-similarity');


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
const { getElementsByTagType, find } = require('domutils');
const { off, connected } = require('process');
const { ok } = require('assert');
const e = require('express');
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


app.get('/ScrapeDataFromApollo', async (req, res) => {
    extractAddress = async (url) => {
        console.log(url)
        const { data } = await axios.get(url)
        const $ = cheerio.load(data);

        // console.log(($('.PharmacyProductsListing_name__jg_lu').text()))
        const elements = $('.marginTop-8');

        console.log({
            "Medicine Name": $(elements[2]).text(),
            "Product Description": $(elements[15]).text(),
            "Uses Of Medicine": $(elements[17]).text(),
            "Benefits Of Medicine": $(elements[19]).html(),
            "SideEffects Of Medicine": $(elements[21]).html(),
        });


    };

    extractLinksOnly = async (url) => {
        const { data } = await axios.get(url)
        const $ = cheerio.load(data);

        var a = $('.houWZm a');
        var d = [];
        a.each((index, element) => {
            // Access element properties or content here
            fs.appendFile('./MedicineNamesStartingWithC.txt', $(element).text() + '\n', (err) => {
                if (err) {
                    console.error('Error writing to buy.txt:', err);
                } else {
                    console.log(`found...${url}`);
                }
            });
        });

    };

    var links = [];
    for (var i = 1; i <= 533; i++) {

        await extractLinksOnly(`https://www.truemeds.in/all-medicine-list?page=${i}&label=c`);
        console.log(i+" - found");

    }
    console.log("DONE");
})

app.get('/addLinksToMednames', async (req, res) => {
    fs.readFile('MedicineNamesStartingWithC.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        
        // Split the data into an array of medicine names
        const medicineNames = data.split('\n').map(name => name.replace(/[^\w\s+\/\\]/gi, '').replace('%', '').trim());

        
        
        // Construct links for each medicine name
        for (const medicineName of medicineNames) {
            try {
                // Construct the URL for the API endpoint
                const link = `http://localhost:4000/fastCompMorePharmasFasterOp?medname=${encodeURIComponent(medicineName)}`;
                
                // Make the API request and wait for the response
                const response = await axios.get(link);
                
                // Append the response data to the file
                fs.appendFile('./MedicineLinksForNamesStartingWithZ.txt', `${medicineName} : ${JSON.stringify(response.data)}\n`, err => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    
                    console.log(`Link for ${medicineName} saved to MedicineLinksForNamesStartingWithZ.txt`);
                    var message= `${medicineName} Search Complete`;
                    say.speak(message);


                });
            } catch (error) {
                console.error(`Error fetching data for ${medicineName}: ${error.message}`);
            }
        }
    });
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

function calculateSimilarity(name1, name2) {
    const similarity = stringSimilarity.compareTwoStrings(name1, name2);
    const percentage = similarity * 100;
    return percentage.toFixed(2);
}

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
        ['https://localhost:1000/compare?medname=Dolo-650+Tablet+10%27s',
            'https://localhost:1000/compare?medname=Volini+Pain+Relief+Spray%2C+40+gm',
            'https://localhost:1000/compare?medname=Moov+Pain+Relief+Cream%2C+15+gm',
            'https://localhost:1000/compare?medname=Dolo-650+Tablet+10%27s',
            'https://localhost:1000/compare?medname=endoreg%2014s',
        ]);
    // console.log(LinkDataResponses[0].data);

    for (var i = 0; i < 5; i++) {
        const $ = cheerio.load(LinkDataResponses[i].data);
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


    urlForPe = `https://www.bing.com/search?q= chemists in ${req.query['chemCity']}  pincode-${req.query['chemPin']} `;
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
    await extractdoe(docUrl); z``
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

function getDeliveryChargeForPharmeasy(totalMedPrice) {
    var dc = 0;
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
extractDataOfPharmEasy = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        // const offer =await getOffersOfPharmeasy();
        const $ = cheerio.load(data, { xmlMode: false });

        var a = JSON.parse($('script[type=application/json]').text());
        var dc = '';
        var dc = 0;
        if (parseInt(a['props']['pageProps']['productDetails']['costPrice']) < 300) {
            dc = 199;
        } else if (parseInt(a['props']['pageProps']['productDetails']['costPrice']) >= 300 && parseInt(a['props']['pageProps']['productDetails']['costPrice']) < 500) {
            dc = 129;
        } else if (parseInt(a['props']['pageProps']['productDetails']['costPrice']) >= 500 && parseInt(a['props']['pageProps']['productDetails']['costPrice']) < 750) {
            dc = 49;
        } else if (parseInt(a['props']['pageProps']['productDetails']['costPrice']) >= 750 && parseInt(a['props']['pageProps']['productDetails']['costPrice']) < 1000) {
            dc = 25;
        } else if (parseInt(a['props']['pageProps']['productDetails']['costPrice']) >= 1000 && parseInt(a['props']['pageProps']['productDetails']['costPrice']) < 1250) {
            dc = 14;
        } else if (parseInt(a['props']['pageProps']['productDetails']['costPrice']) >= 1250) {
            dc = 0;
        }

        try {
            var imgurl = a['props']['pageProps']['productDetails']['damImages'][0]['url'];
        } catch (e) {
            imgurl = "";
        }

        return {
            name: 'PharmEasy',
            item: a['props']['pageProps']['productDetails']['name'].substring(0, 30),
            link: url,
            imgLink: imgurl,
            price: parseInt(a['props']['pageProps']['productDetails']['costPrice']),
            offer: '',
            deliveryCharge: dc ? dc : 0,
            finalCharge: parseFloat(a['props']['pageProps']['productDetails']['costPrice']) + dc,
            similarityIndex: calculateSimilarity(a['props']['pageProps']['productDetails']['name'].toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: a['props']['pageProps']['productDetails']['manufacturer'],
            medicineAvailability:(a['props']['pageProps']['productDetails']['productAvailabilityFlags']['isAvailable']),
            // saltName:a['props']['pageProps']['productDetails']['compositions'][0]['name'],
            // qtyItContainsDesc:a['props']['pageProps']['productDetails']['measurementUnit'],
        };


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);

        console.log(error);
        return {};
    }
};

extractDataOfFlipkart = async (url, nameOfMed) => {
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
            item: ($('.custAddCrtBtn').attr('displayname')).substring(0, 30),
            link: url,
            imgLink: $('#med_dtl_img').attr('src'),
            price: $('.custAddCrtBtn').attr('offerprice'),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat($('.custAddCrtBtn').attr('offerprice')) + parseFloat(dc),
            similarityIndex: calculateSimilarity(($('.custAddCrtBtn').attr('displayname')).toLowerCase(), nameOfMed.toLowerCase()),


        };
    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);

        console.log(error);
        return {};
    }
};

function getDeliveryChargeForNetmeds(totalMedPrice) {
    var dc = 0;
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
extractDataOfNetMeds = async (url, nameOfMed) => {
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
            item: $('.product-detail .prodName h1').first().text(),
            link: url,
            imgLink: $('.largeimage img').attr('src'),
            price: $('#last_price').attr('value'),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat($('#last_price').attr('value')) + parseFloat(dc),
            similarityIndex: calculateSimilarity($('.product-detail .prodName h1').first().text().toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: $('span[class=drug-manu] > a').first().text(),
            medicineAvailability:$('.os-txt').text() == "" ? true:false,
            // saltName:$('.drug-conf').first().text(),
            // qtyItContainsDesc:$('.drug-varient').first().text(),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForApollo(totalMedPrice) {
    var dc = 0;
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
extractDataOfApollo = async (url, final, presReq, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlMode: false });
        const apolloData = JSON.parse($('#__NEXT_DATA__').text());
        console.log(url);

        console.log($('.PdpWeb_subTxt__Soj3p').text());

        try {
            m = apolloData.props.pageProps.productDetails.productdp.special_price;
            console.log(m)
        } catch (error) {
            m = apolloData.props.pageProps.productDetails.productdp.price;
            console.log(m)
        }
        // if (apolloData['props']['pageProps']['productDetails']['productdp']['is_prescription_required'] == 1) {
        //     presReq[0] = "Yes";
        // }
        //    console.log(fa);

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



        try {
            m = apolloData.props.pageProps.productDetails.productdp.special_price;
            console.log(m)
        } catch (error) {
            m = apolloData.props.pageProps.productDetails.productdp.price;
            console.log(m)
        }
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
            item: apolloData.props.pageProps.productDetails.productdp.name,
            link: url,
            imgLink: 'https://newassets.apollo247.com/pub/media' + apolloData.props.pageProps.productDetails.productdp.image[0],
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
        // const apolloData = JSON.parse($('#__NEXT_DATA__').text());
        const apolloData = await JSON.parse($('script[class="structured-data-list"]').html());
        // console.log("apollo data "+$.html())

        var m = apolloData.offers.price;

        // try {
        //     m = apolloData.props.pageProps.productDetails.productdp.special_price; 
        //     console.log(m)  
        // } catch (error) {
        //     m = apolloData.props.pageProps.productDetails.productdp.price;
        //     console.log(m)  
        // }

        // console.log("Generic Option For" + apolloData.props.pageProps.productDetails.productdp[0].name + " ->  " + $('.PdpWeb_subTxt__Soj3p').text());

        // var a = JSON.parse($('#__NEXT_DATA__').text());
        // var fa = a['props']['pageProps']['productDetails']['similar_products'];
        // if (!fa) {
        //     fa = a['props']['pageProps']['productDetails'];
        // }


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
            item: apolloData.name,
            link: url,
            imgLink: '',//image code yet to be found !!!
            price: m,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(m) + parseFloat(dc),
            similarityIndex: calculateSimilarity(apolloData.name.toLowerCase(), nameOfMed.toLowerCase()),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

extractDataOfHealthmug = async (url) => {
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

function getDeliveryChargeForTrueMeds(totalMedPrice) {
    if (parseInt(totalMedPrice) < 500) {
        dc = 50;
    } else if (parseInt(totalMedPrice) >= 500) {
        dc = 0;
    }

    return dc;
}
//newely added TRUEMEDS
extractDataOfTruemeds = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlParse: false });
        // console.log($.html());
        // console.log($('.medName').text());
        // console.log($('.medSelling').first().text());
        // console.log($('.image-gallery-image img').attr('src'));
        var dc = '';

        if (parseInt($('.medSelling').first().text().split('₹')[1]) < 500) {
            dc = 50;
        } else if (parseInt($('.medSelling').first().text().split('₹')[1]) >= 500) {
            dc = 0;
        }


        return {
            name: 'TrueMeds',
            item: $('.medName').first().text(),
            link: url,
            imgLink: $('.image-gallery-image img').attr('src'),
            price: parseInt($('.medSelling').first().text().split('₹')[1]),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseInt($('.medSelling').first().text().split('₹')[1]) + parseFloat(dc),
            similarityIndex: calculateSimilarity($('.medName').first().text().toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: $('#manufacturer').first().text(),
            medicineAvailability:$('#pdActionCta').text() == "Add To Cart" ? true:false,
            // saltName:$('.compositionDescription ').first().text(),
            // qtyItContainsDesc:$('.medStrips').first().text(),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForHealthskool(totalMedPrice) {
    var dc = 0;

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
extractDataOfHealthskoolpharmacy = async (url, nameOfMed) => {
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
            item: $('.product-title').text().substring(0, 30),
            link: url,
            imgLink: $('.product-info .image a').first().attr('href'),
            price: Curr_price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(Curr_price) + parseFloat(dc),
            similarityIndex: calculateSimilarity($('.product-title').text().toLowerCase(), nameOfMed.toLowerCase()),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};


extractDataOf3Meds = async (url, nameOfMed) => {
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
            item: $('h1').text().substring(0, 30),
            link: url,
            imgLink: $('.productimg img').first().attr('src'),
            price: p,
            offer: offers,
            similarityIndex: calculateSimilarity($('h1').text().toLowerCase(), nameOfMed.toLowerCase()),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

function getDeliveryChargeForTata1mg(m) {
    var dc = 0;
    if (parseInt(m) > 0 && parseInt(m) < 100) { 
        dc = 81; 
    } else if(parseInt(m) >= 100 && parseInt(m) < 200) {
        dc = 75;
    }else if(parseInt(m)>=200){
        dc=0;
    }

    return dc;
}

extractDataOfTata = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        console.log(url);
        const { data } = await axios.get(url);

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var t, m;
        // console.log($.html());
        return {};

        t = $('title').text().split(':')[0];


        // if ($('.container-fluid-padded h1').text()) {
        //     t = $('.container-fluid-padded h1').text();

        // } else if ($('.style__pro-title___3G3rr').first().text()) {

        //     t = $('.style__pro-title___3G3rr').first().text();
        // } else if ($('.style__pro-title___3zxNC').first().text()) {
        //     t = $('.style__pro-title___3zxNC').first().text();
        // } else if ($('.style__pro-title___2QwJy').first().text()) {
        //     t = $('.style__pro-title___2QwJy').first().text();
        // } else if ($('.PriceWidget__selectedContainer__cCRai .marginTop-8').first().text()) {
        //     t = $('.PriceWidget__selectedContainer__cCRai .marginTop-8').first().text();
        // } else if ($('title').first().text().split(":")[0]) {
        //     t = $('title').first().text().split(":")[0];
        // } else {
        //     t = $('h1[class=col-6]').first().text()
        // }
        // t = $('.style__pro-title___3G3rr').first().text();


        m = $('span[class="l4SemiBold"]').first().text();
        // if ($('.Price__price__22Jxo').text()) {

        //     m = $('.Price__price__22Jxo').text();

        // } else if ($('.style__price-tag___B2csA').first().text()) {

        //     m = $('.style__price-tag___B2csA').first().text();

        // } else if ($('.style__product-pricing___1OxnE').first().text()) {

        //     m = $('.style__product-pricing___1OxnE').first().text();

        // } else if ($('.style__price-tag___cOxYc').first().text()) {
        //     m = $('.style__price-tag___cOxYc').first().text();
        // } else if ($('.PriceWidget__marginLeft__dk5gl .l4SemiBold').first().text()) {
        //     m = $('.PriceWidget__marginLeft__dk5gl .l4SemiBold').first().text();
        // } else {
        //     m = $('.l3Regular').first().text();
        // }

        // console.log(m, "===", t)
        if (m != '') {
            console.log(m);


            if (m.includes("MRP")) {
                m = m.split("MRP")[0];
            } else if (m.includes('₹')) {
                m = m.split("₹")[1];
            } else if (m.includes('MRP')) {
                m = m.split("MRP")[1].trim();
            } else if (m.includes('₹')) {
                m = m.split('₹')[1];
            }
        }

        console.log(m, "===", t)
        if (t == "" && m == "") {
            t = "Not Available";
            m = "Not Available";
        }

        var marketername;
        $('script[type="application/ld+json"]').each((index, element) => {
            const scriptContent = $(element).html();
            const json = JSON.parse(scriptContent);
            if (json.marketer && json.marketer.legalName) {
                marketername = (json.marketer.legalName);
            }
        });

        if (marketername == undefined) {
            $('script[type="application/ld+json"]').each((index, element) => {
                const scriptContent = $(element).html();
                const json = JSON.parse(scriptContent);
                if (json.marketer && json.marketer.name) {
                    marketername = (json.marketer.name);
                }
            });
        }

        var dc = 0;
        if (parseInt(m) > 0 && parseInt(m) < 100) { 
            dc = 81; 
        } else if(parseInt(m) >= 100 && parseInt(m) < 200) {
            dc = 75;
        }else if(parseInt(m)>=200){
            dc=0;
        }


        return {
            name: 'Tata 1mg',
            item: t,
            link: url,
            price: m,
            imgLink: $('.widget-container img').attr('src'),
            // price: $('.DrugPriceBox__price___dj2lv').text(),
            // price: $('span[property=priceCurrency]').text()
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(m) + dc,
            similarityIndex: calculateSimilarity(t.toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: marketername,
            medicineAvailability:true,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        return {};
    }
};


function getDeliveryChargeForPulsePlus(totalMedPrice) {
    var dc = 0;
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

extractDataOfmedplusMart = async (url, nameOfMed) => {
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
            item: $('#divProductTitle>h1').text().substring(0, 30),
            link: url,
            imgLink: $('.profile-picture').attr('src'),
            // price: $('.DrugPriceBox__price___dj2lv').text(),
            // price: $('span[property=priceCurrency]').text()
            price: t,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(t) + parseFloat(dc),
            similarityIndex: calculateSimilarity($('#divProductTitle>h1').text().toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: $('#divProductTitle>div').text(),
            medicineAvailability:$('.text-primary2').text() =="In Stock" ? true:false,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

function getDeliveryChargeForMyUpChar(totalMedPrice) {
    var dc = 0;
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
extractDataOfMyUpChar = async (url, nameOfMed) => {
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
            item: a.substring(0, 30),
            link: url,
            imgLink: $('.image_slide').attr('src'),
            price: b,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(b) + parseFloat(dc),
            similarityIndex: calculateSimilarity(a.toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: "NA",
            medicineAvailability:true,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForTabletShablet(totalMedPrice) {
    var dc = 0;

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
extractDataOfOBP = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var a=JSON.parse($('script[type=application/ld+json]').html());
        // console.log($.html());
        var p =a['@graph'][a['@graph'].length-1].offers.price;
        // if (!p) {
        //     p = $('.price').first().text()
        // }
        // if (p) {
        //     if (p.includes(" – ")) {
        //         console.log(p)
        //         p = p.split(" – ")[0];
        //         console.log(p)
        //     }
        // }
        // if (p) {
        //     if (p.includes('₹')) {
        //         p = p.split('₹')[1];
        //     }
        //     if (p.includes(',')) {
        //         p = p.replace(',', '');
        //     }
        // }

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
            item: $('.entry-title').text().substring(0, 30),
            link: url,
            imgLink: $('.jws-gallery-image img').attr('src'),
            price: p,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(p) + parseFloat(dc),
            similarityIndex: calculateSimilarity($('.entry-title').text().toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: $('.woocommerce-product-attributes-item__value > p').first().text(),
            medicineAvailability:true,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

extractDataOfPP = async (url, nameOfMed) => {
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

        if (dataOfPP.offers.price < 280) {
            dc = 68;
        } else if (dataOfPP.offers.price >= 280 && dataOfPP.offers.price < 1000) {
            dc = 58;
        } else if (dataOfPP.offers.price >= 1000) {
            dc = 8;
        }
        // console.log($.html());

        return {
            name: 'Pasumai Pharmacy',
            item: dataOfPP.name.substring(0, 30),
            link: url,
            imgLink: dataOfPP.image,
            price: dataOfPP.offers.price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(dataOfPP.offers.price) + parseFloat(dc),
            similarityIndex: calculateSimilarity(dataOfPP.name.toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: $('#divProductTitle > label[class=text-muted]').text(),
            medicineAvailability:dataOfPP.offers.availability=='http://schema.org/InStock'?true:false,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForPasumai(totalMedPrice) {
    var dc = 0;
    if (totalMedPrice < 1000) {
        dc = 50;
    } else if (totalMedPrice >= 1000) {
        dc = 0;
    }
    return dc;
}

function getDeliveryChargeForMedPlusMart(totalMedPrice) {
    var dc = 0;
    if (parseInt(totalMedPrice) < 200) {
        dc = 40;
    } else if (parseInt(totalMedPrice) >= 200) {
        dc = 20;
    }

    return dc;
}


extractDataOfEgmedi = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        // console.log($.html());

        return {
            name: 'Egmedi',
            item: $('.product h2').first().text().substring(0, 30),
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


function getDeliveryChargeForOgMedPlusMart(totalMedPrice) {
    var dc = 0;
    return dc;
}

//added new 

extractDataOfOgMPM = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var a = await JSON.parse($('script[type="application/ld+json"]:contains("productID")').text());

        var dc = 0;
        if (parseInt(a.offers.mrp ? a.offers.mrp : 0) > 0 && parseInt(a.offers.mrp ? a.offers.mrp : 0) < 350) {
            dc = 40;
        } else if (parseInt(a.offers.mrp ? a.offers.mrp : 0) >= 350) {
            dc = 20;
        }
        return {
            name: 'MedplusMart',
            item: a.name,
            link: url,
            imgLink: a.image,
            price: parseInt(a.offers.mrp ? a.offers.mrp : 0),
            deliveryCharge: dc,
            offer: '',
            finalCharge: parseInt(a.offers.mrp ? a.offers.mrp : 0),
            similarityIndex: calculateSimilarity(a.name.toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: a.brand.name,
            medicineAvailability:true,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'MedplusMart',
            item: 'NA',
            link: url,
            imgLink: '',
            price: '',
            deliveryCharge: 0,
            offer: '',
            finalCharge: '',
        };
    }
};

extractDataOfTorus = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);


        return {
            name: 'Torus',
            item: $('.productdetail_title h3').text(),
            link: url,
            imgLink: $('.imgBox img').attr('src'),
            price: parseFloat($('.productdit_pricebox h3').text().split('Rs')[1]),
            deliveryCharge: 0,
            offer: '',
            finalCharge: parseInt(parseFloat($('.productdit_pricebox h3').text().split('Rs')[1]) + 0),
            similarityIndex: calculateSimilarity($('.productdetail_title h3').text().toLowerCase(), nameOfMed.toLowerCase()),
            manufacturerName: $('.prodcompnamtext > span').first().text(),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Torus',
            item: 'NA',
            link: url,
            imgLink: '',
            price: '',
            deliveryCharge: 0,
            offer: '',
            finalCharge: '',
        };
    }
};



extractDataOfOneBharatPharmacy = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var dataOfPP = {};


        var dc = '';

        if (dataOfPP.offers.price < 700) {
            dc = 50;
        } else if (dataOfPP.offers.price >= 700) {
            dc = 0;
        }
        // console.log($.html());

        return {
            name: 'One Bharat Pharmacy',
            item: $('.productdetail_title').first().text().trim(),
            link: url,
            imgLink: $('.demo').first().attr('src'),
            price: $('.productdit_pricebox h3').first().text().split('₹')[1].trim(),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat($('.productdit_pricebox').first().text()) + parseFloat(dc),
            similarityIndex: calculateSimilarity($('.productdetail_title').first().text().trim(), nameOfMed.toLowerCase()),
            manufacturerName: $('.prodcompnamtext > h4 > span').first().text(),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

// extractDataOfKauverymeds = async (url, nameOfMed) => {
//     try {
//         // Fetching HTML
//         const { data } = await axios.get(url)

//         // Using cheerio to extract <a> tags
//         const $ = cheerio.load(data);
//         var dataOfPP = {};


//         var dc = '';

//         if (dataOfPP.offers.price < 700) {
//             dc = 50;
//         } else if (dataOfPP.offers.price >= 700) {
//             dc = 0;
//         }
//         // console.log($.html());

//         return {
//             name: 'Kauverymeds',
//             item: $('.productdetail_title').first().text().trim(),
//             link: url,
//             imgLink: $('.demo').first().attr('src'),
//             price:$('.productpricers_set .main_price').first().text().trim(),
//             offer: '',
//             deliveryCharge: dc,
//             finalCharge: parseFloat($('.productdit_pricebox').first().text()) + parseFloat(dc),
//             similarityIndex: calculateSimilarity($('.productdetail_title').first().text().trim(), nameOfMed.toLowerCase()),
//             manufacturerName: $('.prodcompnamtext > p > span').first().text(),
//         };

//     } catch (error) {
//         // res.sendFile(__dirname + '/try.html');
//         // res.sendFile(__dirname + '/error.html');
//         // console.log(error);
//         return {};
//     }
// };






extractLinkFromOptimizedyahoo = async (url, pharmaNames, medname) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        const $ = cheerio.load(data);

        console.log("fetchedDataFromYahoo");
        var keywords = medname.split(' ');

        var resultsA = [], resultsB = [], resultsC = [], resultsD = [], resultsE = [], resultsF = [], resultsG = [], resultsH = [], resultsI = [], resultsJ = [], resultsK = [], resultsL = [], resultsM = [], resultsN = [], resultsO = [], resultsP = [];

        console.log("-----------");
        console.log(pharmaNames);
        $('#web ol li h3 a').each(function () {
            var str = $(this).attr('href');
            //dolo 650 mg

            // console.log(str);

            if (str.includes(pharmaNames[0]) && !str.includes("yahoo.com") && pharmaNames[0] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsA.push({ plink: str, point: count });

            } else if (str.includes(pharmaNames[1]) && !str.includes("yahoo.com") && pharmaNames[1] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsB.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[2]) && !str.includes("yahoo.com") && pharmaNames[2] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsC.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[3]) && !str.includes("yahoo.com") && pharmaNames[3] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsD.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[4]) && !str.includes("yahoo.com") && pharmaNames[4] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsE.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[5]) && !str.includes("yahoo.com") && pharmaNames[5] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsF.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[6]) && !str.includes("yahoo.com") && pharmaNames[6] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsG.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[7]) && !str.includes("yahoo.com") && pharmaNames[7] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsH.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[8]) && !str.includes("yahoo.com") && pharmaNames[8] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsI.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[9]) && !str.includes("yahoo.com") && pharmaNames[9] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsJ.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[10]) && !str.includes("yahoo.com") && pharmaNames[10] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsK.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[11]) && !str.includes("yahoo.com") && pharmaNames[11] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsL.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[12]) && !str.includes("yahoo.com") && pharmaNames[12] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsM.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[13]) && !str.includes("yahoo.com") && pharmaNames[13] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsN.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[14]) && !str.includes("yahoo.com") && pharmaNames[14] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsO.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[15]) && !str.includes("yahoo.com") && pharmaNames[15] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsP.push({ plink: str, point: count });
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
        resultsD.sort((a, b) => {
            return b.point - a.point;
        });
        resultsE.sort((a, b) => {
            return b.point - a.point;
        });
        resultsF.sort((a, b) => {
            return b.point - a.point;
        });
        resultsG.sort((a, b) => {
            return b.point - a.point;
        });
        resultsH.sort((a, b) => {
            return b.point - a.point;
        });
        resultsI.sort((a, b) => {
            return b.point - a.point;
        });
        resultsJ.sort((a, b) => {
            return b.point - a.point;
        });
        resultsK.sort((a, b) => {
            return b.point - a.point;
        });
        resultsL.sort((a, b) => {
            return b.point - a.point;
        });
        resultsM.sort((a, b) => {
            return b.point - a.point;
        });
        resultsN.sort((a, b) => {
            return b.point - a.point;
        });
        resultsO.sort((a, b) => {
            return b.point - a.point;
        });
        resultsP.sort((a, b) => {
            return b.point - a.point;
        });




        const final = [];

        try {
            final.push(resultsA[0]['plink'])
            console.log(resultsA[0]['plink'])
            pharmaNames[0] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsB[0]['plink'])
            console.log(resultsB[0]['plink'])
            pharmaNames[1] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsC[0]['plink'])
            console.log(resultsC[0]['plink'])
            pharmaNames[2] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsD[0]['plink'])
            console.log(resultsD[0]['plink'])
            pharmaNames[3] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsE[0]['plink'])
            console.log(resultsE[0]['plink'])
            pharmaNames[4] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsF[0]['plink'])
            console.log(resultsF[0]['plink'])

            pharmaNames[5] = 0;
        } catch (error) {
            // final.push(0)
        }
        try {
            final.push(resultsG[0]['plink'])
            console.log(resultsG[0]['plink'])
            pharmaNames[6] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsH[0]['plink'])
            console.log(resultsH[0]['plink'])
            pharmaNames[7] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsI[0]['plink'])
            console.log(resultsI[0]['plink'])
            pharmaNames[8] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsJ[0]['plink'])
            console.log(resultsJ[0]['plink'])
            pharmaNames[9] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsK[0]['plink'])
            console.log(resultsK[0]['plink'])
            pharmaNames[10] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsL[0]['plink'])
            console.log(resultsL[0]['plink'])
            pharmaNames[11] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsM[0]['plink'])
            console.log(resultsM[0]['plink'])
            pharmaNames[12] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsN[0]['plink'])
            console.log(resultsN[0]['plink'])
            pharmaNames[13] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsO[0]['plink'])
            console.log(resultsO[0]['plink'])
            pharmaNames[14] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsP[0]['plink'])
            console.log(resultsP[0]['plink'])
            pharmaNames[15] = 0;
        } catch (error) {
            // final.push(0)
        }



        return final;
        // url = rawUrl.split("/url?q=")[1].split("&")[0];
        // console.log('Extracting url: ', url);


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');

        console.log(error)
        return 0;
    }
};

fasterIgextractLinkFromOptimizedyahoo = async (url, pharmaNames, medname) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const keywords = medname.split(' ');

        const results = pharmaNames.map(() => []);

        $('#web ol li h3 a').each(function () {
            const str = $(this).attr('href');

            pharmaNames.forEach((pharmaName, index) => {
                if (str.includes(pharmaName) && !str.includes("yahoo.com") && pharmaName !== 0) {
                    let count = 1;
                    keywords.forEach((keyword) => {
                        if ((new RegExp("\\b" + keyword + "\\b", "i").test(str))) {
                            count++;
                        }
                    });
                    results[index].push({ plink: str, point: count });
                }
            });
        });

        const final=[];
        
        for(var i=0;i<results.length;i++){
            results[i].sort((a, b) => b.point - a.point);
        }
        // console.log(results)

        results.forEach((result, index) => {
            try {
                final.push(result[0]['plink']);
                console.log(result[0]['plink']);
                pharmaNames[index] = 0;
            } catch (error) {
                // final.push(0)
            }
        });

        // console.log(final)
        return final;
    } catch (error) {
        console.log(error);
        return 0;
    }
};

function checkforzero(arr) {
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == 0) {
            count++;
        }
    }
    return count;
}

const tempfzz = [];

app.get('/getUpdatesOfMultiMeds', async (req, res) => {

    res.send(tempfzz);
});

app.get('/FastGetPharmaDataFromLinks', async (req, res) => {
    const pharmaLinkArray = req.query['pharmalinks'].split(",");
    // console.log(typeof(req.query['pharmalinks']));
    var medName = req.query['medname'];
    console.log(medName)
    console.log("76567")
    const pharmaData = []


    pharmaData.push(await Promise.all([
        extractDataOfNetMeds(pharmaLinkArray[0], medName),
        extractDataOfPharmEasy(pharmaLinkArray[1], medName),
        extractDataOfOBP(pharmaLinkArray[2], medName),
        extractDataOfmedplusMart(pharmaLinkArray[3], medName),
        extractDataOfMyUpChar(pharmaLinkArray[4], medName),
        extractDataOfPP(pharmaLinkArray[5], medName),
        extractDataOfOgMPM(pharmaLinkArray[6], medName),
        extractDataOfTruemeds(pharmaLinkArray[7], medName),
        extractDataOfTata(pharmaLinkArray[8], medName),
    ]));
    console.log(pharmaData.data);
    // res.send(pharmaData);



    res.send(pharmaData);

});



app.get('/findCombination', async (req, res) => {
    console.log(res.query['q'])
});


app.get('/fastComp', async (req, res) => {


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];


    var tempFinal = [];

    var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


    var arr = [

        'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in',
        'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
        'truemeds.in', '1mg.com',
    ]


    var cont = checkforzero(arr);
    // console.log(arr)
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var tries = 0;
    while (cont != 9) {


        tries++;
        mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await extractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];

        cont = checkforzero(arr);
        console.log("Try -> " + tries);
    }
    tempf = tempf.flat();

    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("netmeds")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[1] = tempf[k];
        }
        // else if (tempf[k].includes("healthskool")) {
        // t[3]=tempf[k];
        // } 
        else if (tempf[k].includes("tabletshablet")) {
            t[2] = tempf[k];
        } else if (tempf[k].includes("pulseplus")) {
            t[3] = tempf[k];
        } else if (tempf[k].includes("myupchar")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("pasumai")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[7] = tempf[k];
        } else if (tempf[k].includes("1mg")) {
            t[8] = tempf[k];
        }
    }
    console.log(t);

    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])




    res.send(t);

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

app.get('/fastCompMorePharmas', async (req, res) => {
    // Insert Login Code Here

    // {
    //     // apollo - x
    //     // netmeds -ok
    //     // pharmeasy -x
    //     // healthslool - ok
    //     // tabletshablet - ok
    //     // pulseplus - ok
    //     // medplusmart - ok
    //     // pasumai - ok
    // } for med price change as per location

    // {
    //     // apollo -  x
    //     // netmeds - ok final
    //     // pharmeasy - x 
    //     // healthslool - ok final
    //     // tabletshablet - ok final
    //     // pulseplus - ok  work on it 
    //     // medplusmart - ok final
    //     // pasumai - ok ~ 
    // } for delivery price change as per location


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];


    var tempFinal = [];

    var mixUrl;
    // var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


    var arr = [

        'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in',
        'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
        'truemeds.in', '1mg.com', 'onebharatpharmacy.com',
        'kauverymeds.com', 'indimedo.com', 'wellnessforever.com',
        'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    ]


    var cont = checkforzero(arr);
    // console.log(arr)
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var tries = 0;
    while (cont != 16) {


        tries++;
        mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];

        cont = checkforzero(arr);
        console.log(cont)
        console.log("Try -> " + tries);
    }
    tempf = tempf.flat();

    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("netmeds")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[1] = tempf[k];
        }
        // else if (tempf[k].includes("healthskool")) {
        // t[3]=tempf[k];
        // } 
        else if (tempf[k].includes("tabletshablet")) {
            t[2] = tempf[k];
        } else if (tempf[k].includes("pulseplus")) {
            t[3] = tempf[k];
        } else if (tempf[k].includes("myupchar")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("pasumai")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[7] = tempf[k];
        } else if (tempf[k].includes("1mg")) {
            t[8] = tempf[k];
        } else if (tempf[k].includes("onebharatpharmacy")) {
            t[9] = tempf[k];
        } else if (tempf[k].includes("kauverymeds")) {
            t[10] = tempf[k];
        } else if (tempf[k].includes("indimedo")) {
            t[11] = tempf[k];
        } else if (tempf[k].includes("wellnessforever")) {
            t[12] = tempf[k];
        } else if (tempf[k].includes("secondmedic")) {
            t[13] = tempf[k];
        } else if (tempf[k].includes("chemistsworld")) {
            t[14] = tempf[k];
        } else if (tempf[k].includes("callhealth")) {
            t[15] = tempf[k];
        }
    }
    console.log(t);

    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])




    res.send(t);

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

app.get('/fastCompMorePharmasUsingAxiosParallel', async (req, res) => {


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];

    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const urlForNetMeds = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+netmeds.com) &vs=netmeds.com`;
    const urlForPharmEasy = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+pharmeasy.in) &vs=pharmeasy.in`;  //*//
    const urlForPP = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+pasumaipharmacy.com) &vs=pasumaipharmacy.com`;
    const urlForPulsePlus = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+pulseplus.in) &vs=pulseplus.in`;
    const urlForOBP = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+tabletshablet.com) &vs=tabletshablet.com`;
    const urlForMedPlusMart = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+medplusmart.com) &vs=medplusmart.com`;
    const urlForMyUpChar = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+myupchar.com) &vs=myupchar.com`;
    const urlForTruemeds = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+truemeds.in) &vs=truemeds.in`;
    const urlForTata = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+1mg.com) &vs=1mg.com`;

    const urlForOneBharat = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+onebharatpharmacy.com) &vs=onebharatpharmacy.com`;
    const urlForKauverymeds = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+kauverymeds.com) &vs=kauverymeds.com`;
    const urlForIndimedo = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+indimedo.com) &vs=indimedo.com`;
    const urlForWellnessforever = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+wellnessforever.com) &vs=wellnessforever.com`;
    const urlForSecondmedic = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+secondmedic.com) &vs=secondmedic.com`;
    const urlForChemistsworld = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+chemistsworld.com) &vs=chemistsworld.com`;
    const urlForCallhealth = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+callhealth.com) &vs=callhealth.com`;


    t = await Promise.all([
        extractLinkFromyahoo(urlForNetMeds), extractLinkFromyahoo(urlForPharmEasy), extractLinkFromyahoo(urlForPP),
        extractLinkFromyahoo(urlForPulsePlus), extractLinkFromyahoo(urlForOBP), extractLinkFromyahoo(urlForMedPlusMart),
        extractLinkFromyahoo(urlForMyUpChar), extractLinkFromyahoo(urlForTruemeds), extractLinkFromyahoo(urlForTata), extractLinkFromyahoo(urlForOneBharat),
        extractLinkFromyahoo(urlForKauverymeds), extractLinkFromyahoo(urlForIndimedo),
        extractLinkFromyahoo(urlForWellnessforever), extractLinkFromyahoo(urlForSecondmedic),
        extractLinkFromyahoo(urlForChemistsworld), extractLinkFromyahoo(urlForCallhealth)
    ])

    res.send(t);

});


app.get('/fastCompMorePharmasFasterOp', async (req, res) => {
    // Insert Login Code Here

    // {
    //     // apollo - x
    //     // netmeds -ok
    //     // pharmeasy -x
    //     // healthslool - ok
    //     // tabletshablet - ok
    //     // pulseplus - ok
    //     // medplusmart - ok
    //     // pasumai - ok
    // } for med price change as per location

    // {
    //     // apollo -  x
    //     // netmeds - ok final
    //     // pharmeasy - x 
    //     // healthslool - ok final
    //     // tabletshablet - ok final
    //     // pulseplus - ok  work on it 
    //     // medplusmart - ok final
    //     // pasumai - ok ~ 
    // } for delivery price change as per location


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];


    var tempFinal = [];

    var mixUrl;
    // var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


    var arr = [

        'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in',
        'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
        'truemeds.in', '1mg.com', 'onebharatpharmacy.com',
        'kauverymeds.com', 'indimedo.com', 'wellnessforever.com',
        'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    ]


    var cont = checkforzero(arr);
    // console.log(arr)
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var tries = 0;
    while (cont != 16) {


        tries++;
        mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];

        cont = checkforzero(arr);
        console.log(cont)
        console.log("Try -> " + tries);
    }
    tempf = tempf.flat();

    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("netmeds")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[1] = tempf[k];
        }
        // else if (tempf[k].includes("healthskool")) {
        // t[3]=tempf[k];
        // } 
        else if (tempf[k].includes("tabletshablet")) {
            t[2] = tempf[k];
        } else if (tempf[k].includes("pulseplus")) {
            t[3] = tempf[k];
        } else if (tempf[k].includes("myupchar")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("pasumai")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[7] = tempf[k];
        } else if (tempf[k].includes("1mg")) {
            t[8] = tempf[k];
        } else if (tempf[k].includes("onebharatpharmacy")) {
            t[9] = tempf[k];
        } else if (tempf[k].includes("kauverymeds")) {
            t[10] = tempf[k];
        } else if (tempf[k].includes("indimedo")) {
            t[11] = tempf[k];
        } else if (tempf[k].includes("wellnessforever")) {
            t[12] = tempf[k];
        } else if (tempf[k].includes("secondmedic")) {
            t[13] = tempf[k];
        } else if (tempf[k].includes("chemistsworld")) {
            t[14] = tempf[k];
        } else if (tempf[k].includes("callhealth")) {
            t[15] = tempf[k];
        }
    }
    console.log(t);

    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])




    res.send(t);

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

app.get('/getDeliveryPriceOfPharmeasy', async (req, res) => {
    var price = parseFloat(req.query['val']) 
    var dc = 0;
        if (price < 300) {
            dc = 199;
        } else if (price >= 300 && parseInt(price) < 500) {
            dc = 129;
        } else if (price >= 500 && parseInt(price) < 750) {
            dc = 49;
        } else if (price >= 750 && parseInt(price) < 1000) {
            dc = 25;
        } else if (price >= 1000 && parseInt(price) < 1250) {
            dc = 14;
        } else if (price >= 1250) {
            dc = 0;
        }

        res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfNetmeds', async (req, res) => {
    var dc = 0;
    var price = parseFloat(req.query['val']) 
    
    
    if (price < 250) {
            dc = 99;
        } else if (price >= 250 && price < 1000) {
            dc = 29;
        } else if (price > 1000) {
            dc = 0;
        }

        res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfTata1mg', async (req, res) => {
    var price = parseFloat(req.query['val']) 
    var dc = 0;
    if (price > 0 && price < 100) { 
        dc = 81; 
    } else if(price >= 100 && price < 200) {
        dc = 75;
    }else if(price>=200){
        dc=0;
    }
        res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfMedPlusMart', async (req, res) => {
        var price = parseFloat(req.query['val']) 
        var dc = 0;
        if (price > 0 && price < 350) {
        dc = 40;
    } else if (price >= 350) {
        dc = 20;
    }
    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfPasumaiPharmacy', async (req, res) => {
    var price = parseFloat(req.query['val']) 
    var dc = 0;
    
    if (price < 280) {
            dc = 68;
        } else if (price >= 280 && price < 1000) {
            dc = 58;
        } else if (price >= 1000) {
            dc = 8;
        }
        res.send((dc).toString());;
    })
app.get('/getDeliveryPriceOfTabletShablet', async (req, res) => {
    var price = parseFloat(req.query['val']) 
    var dc = 0;
    
    if (price < 500) {
        dc = 68.88;
    } else if (price >= 500 && price < 1000) {
        dc = 50.40;
    } else if (price >= 1000) {
        dc = 0;
    }

        res.send((dc).toString());;
})

app.get('/getDeliveryPriceOfMyUpChar', async (req, res) => {
    var price = parseFloat(req.query['val']) 
    var dc = 0;
    
    if (price < 499) {
        dc = 49;
    } else if (price > 500) {
        dc = 0;
    }
        res.send((dc).toString());;
    })
    
    app.get('/getDeliveryPriceOfPulsePlus', async (req, res) => {
    var price = parseFloat(req.query['val']) 
    var dc = 0;
    
    if (price < 999) {
        dc = 50;
    } else if (price >= 1000) {
        dc = 15;
    }
        res.send((dc).toString());;
})

app.get('/getDeliveryPriceOfTruemeds', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;
    
    if (price < 500) {
        dc = 50;
    } else if (price >= 500) {
        dc = 0;
    }
    console.log(dc)
        res.send((dc).toString());
})


app.post('/algoSuggest', async (req, res) => {
    const pharmaFinaldata=req.body.finalFullData;
    const priceFinal = [];
    var temp = [];

    console.log(pharmaFinaldata)
    for (var i = 0; i < pharmaFinaldata.length; i++) {
        // final.push(pharmaFinaldata[i]['data']);


        pharmaFinaldata[i].forEach(async element => {
            temp.push(parseFloat(element['price'] ? element['price'] : 0));
        })

        // var a=temp;
        // console.log(a);

        priceFinal.push(temp)

        // console.log(temp)
        temp = [];

    }


    function mergeArrays(arrays) {



        const sumArray = arrays.reduce((acc, val) => {
            if (acc.length === 0) {
                return val;
            }


            for (var i = 0; i < acc.length; i++) {
                if (acc[i] == 0) {
                    val[i] = 0;
                }
            }
            console.log("8**************===> " + acc);

            for (var i = 0; i < val.length; i++) {
                if (val[i] == 0) {
                    acc[i] = 0;
                }
            }
            console.log("84590===> " + val);

            return acc.map((num, index) => num + val[index]);

        }, []);

        console.log(sumArray)


        return sumArray;
    }

    console.log(priceFinal)
    const temppriceFinalData = priceFinal;

    var combChart = {};
    var tempcombiChart = [];


    var finalPriceComboChart = {};

    function permute(n, r) {
        const a = [];
        const used = [];
        const result = [];

        function generate(depth) {
            if (depth === r) {
                result.push(a.join(''));
                return;
            }

            for (let i = 1; i <= n; i++) {
                if (!used[i] && (depth === 0 || i > a[depth - 1])) {
                    a[depth] = i;
                    used[i] = true;
                    generate(depth + 1);
                    used[i] = false;
                }
            }
        }

        generate(0);
        return result;
    }



    function findSmallest(arr) {
        let smallest = Infinity;
        let smallestIndex = -1;

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > 0 && arr[i] < smallest) {
                smallest = arr[i];
                smallestIndex = i;
            }
        }

        return smallestIndex;
    }


    for (var i = 1; i <= pharmaFinaldata.length; i++) {
        combChart[i] = (permute(pharmaFinaldata.length, i));
        console.log("9876789  -->>  "+ combChart[i])
        tempcombiChart.push(permute(pharmaFinaldata.length, i));
    }



    var cq = [];
    var tempca = [];
    var smallesTotalCombValues = {};

    for (let key in combChart) {
        console.log(`Key: ${key}`);
        for (let inkey in combChart[key]) {
            var temp = combChart[key][inkey].split('');
            console.log("Combination-> " + temp);
            for (var i = 0; i < temp.length; i++) {
                cq.push(priceFinal[parseInt(temp[i]) - 1])
            }

            tempca = [].concat(mergeArrays(cq));




            for (var k = 0; k < 9; k++) {
                if (k == 0 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForNetmeds(tempca[k]))
                } else if (k == 1 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForPharmeasy(tempca[k]))
                }
                //  else if (k == 3 && tempca[k]) {
                //     tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForHealthskool(tempca[k]))
                // } 
                else if (k == 2 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForTabletShablet(tempca[k]))
                } else if (k == 3 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForPulsePlus(tempca[k]))
                } else if (k == 4 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForMyUpChar(tempca[k]))
                } else if (k == 5 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForPasumai(tempca[k]))
                } else if (k == 6 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForMedPlusMart(tempca[k]))
                }else if (k == 7 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForTrueMeds(tempca[k])) // need to change the delivery name
                }else if (k == 8 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForTata1mg(tempca[k]))
                }
            }//delivery charges are added
            // getDeliveryChargeForTata1mg
            // getDeliveryChargeForTrueMeds


            console.log("!~! "+tempca);
            console.log("Smallest Value --> " + tempca[findSmallest(tempca)]);
            smallesTotalCombValues[combChart[key][inkey]] = tempca[findSmallest(tempca)];
            smallesTotalCombValues[combChart[key][inkey] + "from"] = findSmallest(tempca);
            // smallesTotalCombValues.push(findSmallest(tempca)+1);
            // console.log("You Should Buy Medicine No--> "+temp+" from Pharmacy Number ->"+findSmallest(tempca));

            tempca = [];
            cq = [];

            console.log('\n');


            // finalPriceComboChart[combChart[key][inkey]]
        }
    }


    console.log(smallesTotalCombValues)//here the main logic has to be applied
    tempcombiChart.pop();
    tempcombiChart = [].concat(...tempcombiChart);



    function partitionSet(set) {

        const partitions = [];
    
        function partitionHelper(remainingSet, currentPartition) {
            if (remainingSet.length === 0) {
                if (currentPartition.length > 0) {
                    partitions.push(currentPartition);
                }
                return;
            }
    
            const currentElement = remainingSet[0];
            const restOfSet = remainingSet.slice(1);
    
            // Include current element in a new subset
            partitionHelper(restOfSet, [...currentPartition, [currentElement]]);
            
            // Include current element in existing subsets
            currentPartition.forEach((subset, index) => {
                partitionHelper(restOfSet, [...currentPartition.slice(0, index), [...subset, currentElement], ...currentPartition.slice(index + 1)]);
            });
        }
    
        partitionHelper(set, []);
        return partitions.map(partition => partition.map(subset => [subset.join('')]));
    }
    
    
    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
      }

    
    console.log("--> "+pharmaFinaldata.length);
    var set=[];
    for(var i=1;i<=pharmaFinaldata.length;i++){
     set.push(i)
    }
    const partitions = partitionSet(set);
    console.log("=====>> >> "+typeof(partitions));

    var tempLowestValue=set.toString().replace(/,/g, '');
    var newtemparea=tempLowestValue;

    tempLowestValue=smallesTotalCombValues[tempLowestValue];
    
    console.log(set.toString().replace(/,/g, ''))
    var vvtmp=0;
    for(var i=0;i<partitions.length;i++){
        for(var j=0;j<partitions[i].length;j++){
            // console.log(j+" "+smallesTotalCombValues[partitions[i][j]])
            vvtmp+=smallesTotalCombValues[partitions[i][j]];
        } 
        if(vvtmp<tempLowestValue){
            newtemparea.length=0;
            tempLowestValue=vvtmp;
            console.log("k---"+partitions[i])
            newtemparea.push(partitions[i]);
        }
        vvtmp=0;
    }
    

    var x;
    console.log(newtemparea+" + "+tempLowestValue)
    

    console.log(typeof(newtemparea))
    if(newtemparea.includes(',')){
        x = newtemparea.split(",").map(num => parseInt(num));
        for(var i=0;i<x.length;i++){
            var pname;
            console.log((smallesTotalCombValues[`${x[i]}+'from'`]))
            if (smallesTotalCombValues[x[i]+"from"] == '0' ) {
                pname="Netmeds";
            } else if (smallesTotalCombValues[x[i]+"from"]=='1') {
                pname="Pharmeasy";
            }else if (smallesTotalCombValues[x[i]+"from"]=='2') {
                pname="Tablet Shablet";
            } else if (smallesTotalCombValues[x[i]+"from"]=='3') {
                pname="PulsePlus";
            } else if (smallesTotalCombValues[x[i]+"from"]=='4') {
                pname="MyUpChar";
            } else if (smallesTotalCombValues[x[i]+"from"]=='5') {
                pname="PasumaiPharmacy";
            } else if (smallesTotalCombValues[x[i]+"from"]=='6') {
                pname="MedplusMart";
            }else if (smallesTotalCombValues[x[i]+"from"]=='7') {
                pname="TrueMeds";
            }else if (smallesTotalCombValues[x[i]+"from"]=='8') {
                pname="Tata1mg";
            }
            console.log("BUY "+"Medicine num"+`${x[i]} From `+pname)
        }
    }else{
            var pname;
            console.log(typeof(smallesTotalCombValues[`${newtemparea}from`]))
            if (smallesTotalCombValues[`${newtemparea}from`] == '0' ) {
                pname="Netmeds";
            } else if (smallesTotalCombValues[`${newtemparea}from`]=='1') {
                pname="Pharmeasy";
            }else if (smallesTotalCombValues[`${newtemparea}from`]=='2') {
                pname="Tablet Shablet";
            } else if (smallesTotalCombValues[`${newtemparea}from`]=='3') {
                pname="PulsePlus";
            } else if (smallesTotalCombValues[`${newtemparea}from`]=='4') {
                pname="MyUpChar";
            } else if (smallesTotalCombValues[`${newtemparea}from`]=='5') {
                pname="PasumaiPharmacy";
            } else if (smallesTotalCombValues[`${newtemparea}from`]=='6') {
                pname="MedplusMart";
            }else if (smallesTotalCombValues[`${newtemparea}from`]=='7') {
                pname="TrueMeds";
            }else if (smallesTotalCombValues[`${newtemparea}from`]=='8') {
                pname="Tata1mg";
            }
            console.log("BUY "+"Medicine num"+`${newtemparea} From `+pname)
        }

    



    var tempSum = [];
    var i = 0;
    var j = tempcombiChart.length - 1;

    while (i < j) {
        // console.log(arr[i], arr[j]);
        tempSum.push(parseFloat(smallesTotalCombValues[tempcombiChart[i]]) + parseFloat(smallesTotalCombValues[tempcombiChart[j]]))
        i++;
        j--;
    }

    if (i === j) {
        console.log(tempcombiChart[i]);
    }

    var a = tempcombiChart[findSmallest(tempSum)];
    var b = tempcombiChart[tempcombiChart.length - findSmallest(tempSum) - 1];

    a = a + "from";
    b = b + "from";

    final.push({
        combiString: {
            // bestPossSol:
            //     a + " " + (parseFloat(smallesTotalCombValues[a])) + " & " + b + " " + (parseFloat(smallesTotalCombValues[b]))
            //     + " = " + (parseFloat(smallesTotalCombValues[tempcombiChart[findSmallest(tempSum)]]) + parseFloat(smallesTotalCombValues[tempcombiChart[tempcombiChart.length - findSmallest(tempSum) - 1]])),
            medNames: mnames,
        }
    });

})


app.post('/multiSearch', async (req, res) => {

    const linkdata = [];
    const startF = performance.now();
    const mnames = [];
    console.log(req.body.multiItems);

    if (typeof (req.body.multiItems) == 'object') {

        for (mednames in req.body.multiItems) {

            var medicineN=req.body.multiItems[mednames].replace(/[^a-zA-Z0-9 %+|]/g, '')
            linkdata.push(`http://localhost:4000/fastComp?medname=${medicineN}`)
            mnames.push(medicineN)
        }
    } else {
        console.log(typeof (req.body.multiItems))
        var nameOfMed = req.body.multiItems.trim().replace(/[^a-zA-Z0-9 %+|]/g, '');
        console.log(nameOfMed);
        linkdata.push(`http://localhost:4000/fastComp?medname=${nameOfMed}`);
        mnames.push(nameOfMed)
    }


    console.log("length - > " + mnames.length)


    const responses = await axiosParallel(linkdata);
    // var responses =  linkdata.map(async item =>  {
    //     return await axios.all(item);
    //   });


    console.log("7654567  -> " + responses.length);




    var finalMultiPriceData = [];
    for (var i = 0; i < responses.length; i++) {
        finalMultiPriceData.push(`http://localhost:4000/FastGetPharmaDataFromLinks?pharmalinks=${responses[i]['data']}&medname=${mnames[i]}`);
    }

    // console.log(finalMultiPriceData)


    // console.log(finalMultiPriceData)
    const pharmaFinaldata = await axiosParallel(finalMultiPriceData);

    // console.log(pharmaFinaldata[0])



    //     responses[i]['data']=[].concat(responses[i]['data'][0],responses[i]['data'][1],responses[i]['data'][2]);
    //     console.log(responses[i]['data'])

    //     finalMultiPriceData.push( await Promise.all([extractDataOfApollo(responses[i]['data'][0]), extractDataOfNetMeds( responses[i]['data'][1]),extractDataOfPharmEasy( responses[i]['data'][2]),
    //     extractDataOfHealthskoolpharmacy( responses[i]['data'][3]), extractDataOfOBP( responses[i]['data'][4]),extractDataOfmedplusMart( responses[i]['data'][5]),
    //     extractDataOfMyUpChar( responses[i]['data'][6]), extractDataOfHealthmug( responses[i]['data'][7], final, presReq), extractDataOfPP( responses[i]['data'][8])]))




    const end1 = performance.now() - startF;
    // const responses = await Promise.all(FinalDataFunc);

    console.log("----------")


    const final = [];
    for (var i = 0; i < pharmaFinaldata.length; i++) {
        final.push(pharmaFinaldata[i]['data']);
    }



    console.log(`Execution time for final price scraping: ${end1}ms`);
    // res.render(__dirname + '/temptour', { final: final });
    res.render(__dirname + '/resultsv4Multi.ejs', { final: final });





});


app.get('/compare', async (req, res) => {
    // Insert Login Code Here


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
    // const urlForPulsePlus = `https://in.search.yahoo.com/search;_ylt=?p=site:pulseplus.in+${nameOfMed} medicine`;
    // const urlForMyUpChar = `https://in.search.yahoo.com/search;_ylt=?p=site:myupchar.com+${nameOfMed} medicine`;
    // // const urlFor3Meds = `https://in.search.yahoo.com/search;_ylt=?p=site:3meds.com+${nameOfMed}`
    // const urlForHealthmug = `https://in.search.yahoo.com/search;_ylt=?p=site:healthmug.com+${nameOfMed} medicine`;
    // const urlForPP = `https://in.search.yahoo.com/search;_ylt=?p=site:pasumaipharmacy.com+${nameOfMed} medicine`;
    // const urlForFH = `https://in.search.yahoo.com/search;_ylt=?p=site:healthplus.flipkart.com+${nameOfMed} medicine`;

    const urlForPharmEasy = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+pharmeasy.in) &vs=pharmeasy.in`;  //*//
    const urlForNetMeds = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+netmeds.com) &vs=netmeds.com`;
    const urlForApollo = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+apollopharmacy.in) &vs=apollopharmacy.in`;
    const urlForHealthsKool = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+healthskoolpharmacy.com) &vs=healthskoolpharmacy.com`;
    // const urlForHealthmug = `https://www.healthmug.com/search?keywords=${nameOfMed}`;
    const urlForTata = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+1mg.com) &vs=1mg.com`;
    const urlForOBP = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+tabletshablet.com) &vs=tabletshablet.com`;
    const urlForPulsePlus = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+pulseplus.in) &vs=pulseplus.in`;
    const urlForMyUpChar = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+myupchar.com) &vs=myupchar.com`;
    // const urlFor3Meds = `https://in.in.search.yahoo.com/search=?p=3meds.com+${nameOfMed}`
    const urlForHealthmug = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+healthmug.com) &vs=healthmug.com`;
    const urlForPP = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+pasumaipharmacy.com) &vs=pasumaipharmacy.com`;
    const urlForFH = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+healthplus.flipkart.com) &vs=healthplus.flipkart.com`;

    const urlForTorus = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+health.torusdigital.in) &vs=health.torusdigital.in`;
    const urlForTruemeds = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+truemeds.in) &vs=truemeds.in`;
    const urlForMedPlusMart = `https://in.search.yahoo.com/search?p=inurl:(${nameOfMed}+medplusmart.com) &vs=medplusmart.com`;
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
    extractSubsfApollo = async (url, final) => {
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
            const { data } = await axios.get(url)
            const $ = cheerio.load(data);

            var a = JSON.parse($('#__NEXT_DATA__').text());
            var fa = a.props.pageProps.productDetails.productSubstitutes.products;


            if (fa.length > 0) {
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: fa[i]['name'],
                        subsprice: fa[i]['price'],
                        subsImgLink: fa[i]['image'],
                        subsProdLink: "https://www.apollopharmacy.in" + fa[i]['redirect_url'],
                        price: 0,
                    })
                }

            }

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            console.log(error);
            return error;
        }
    };

    const start = performance.now();
    const item = await Promise.all([extractLinkFromyahoo(urlForTorus), extractLinkFromyahoo(urlForNetMeds), extractLinkFromyahoo(urlForPharmEasy), extractLinkFromyahoo(urlForOBP),
    extractLinkFromyahoo(urlForPulsePlus), extractLinkFromyahoo(urlForMyUpChar), extractLinkFromyahoo(urlForHealthmug),
    extractLinkFromyahoo(urlForPP), extractLinkFromyahoo(urlForApollo), extractLinkFromyahoo(urlForFH), extractLinkFromyahoo(urlForTruemeds),
    extractLinkFromyahoo(urlForMedPlusMart), extractLinkFromyahoo(urlForTata)])

    const end = performance.now() - start;
    console.log(`Execution time for yahoo: ${end}ms`);

    const start1 = performance.now();
    // const LinkDataResponses = await axiosParallel(item);

    const responses = await Promise.all([extractDataOfTorus(item[0], nameOfMed), extractDataOfNetMeds(item[1], nameOfMed), extractDataOfPharmEasy(item[2], nameOfMed),
    extractDataOfOBP(item[3], nameOfMed),
    extractDataOfmedplusMart(item[4], nameOfMed), extractDataOfMyUpChar(item[5], nameOfMed),
    extractDataOfPP(item[7], nameOfMed),
    //   extractSubsfApollo(item[8],final),
    extractDataOfTruemeds(item[10], nameOfMed), extractDataOfOgMPM(item[11], nameOfMed), extractDataOfTata(item[12], nameOfMed),
    ]);

    const end1 = performance.now() - start1;
    console.log(`Execution time for pharmas: ${end1}ms`);
    // const responses = await Promise.all(FinalDataFunc);

    console.log(responses)
    for (var i = 0; i < 10; i++) {
        if (responses[i].name != "NA" && responses[i].price) {
            final.push(responses[i]);
        }
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


    // final.sort((a, b) => a.finalCharge - b.finalCharge); // b - a for reverse sort
    final.push(nameOfMed)
    console.log(final)

    //   if (presReq[0] == "Yes") {
    //       final.push(presReq);
    //   }
    //   final.push(item[7])
    //   final.push(nameOfMed)
    //   console.log(final)

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




    try {

        console.log(final[0].finalCharge)
        console.log(final.length)
        if(final[0].finalCharge>0 && final.length>2){
            res.render(__dirname + '/resultsv4.ejs', { final });
        }else{
            res.sendFile(__dirname + '/noResultsFound.html');
        }
        
    } catch (error) {
        console.error(error);
        res.sendFile(__dirname + '/noResultsFound.html');
    }
    //   res.render(__dirname + '/temptour.ejs', { final: final });



});

const port = process.env.PORT || 4000 // Port we will listen on

// Function to listen on the port
app.listen(port, () => console.log(`This app is listening on port ${port}`));
