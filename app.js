$( document ).ready(function() {

    checkStorage();

    $( document ).delegate("#search", "click", function() {
        loadGeo()
    });
    
    $( document ).delegate(".list-group button", "click", function() {
        const city = $(this).data('city')
        const latitude = $(this).data('latitude')
        const longitude = $(this).data('longitude')

        loadWeather(city, latitude,longitude)
    });

});

function checkStorage() {
    if (localStorage.getItem("meteoCity") === null) {
        $(".container").hide()
        $('#staticBackdrop').modal('show')
    } else {
        console.log('load weather')
        const data = JSON.parse(localStorage.getItem("meteoCity"))
        loadWeather(data.city, data.latitude, data.longitude)
    }
}

function loadGeo() {

    const name = $("#location_search").val()
    if (name.length !== 0) {
        $.ajax({
            type: "GET",
            url: "https://geocoding-api.open-meteo.com/v1/search?name="+name+"&count=10&language=en&format=json",
            dataType: "json"
        }).done(function(x){
            console.log(x)
            $('#search_result').find('button').not('.prototype').remove()
            $('#search_result p.feedback').html()
            
            if (x.results) {
                $('#search_result p.feedback').html(x.results.length + ' találat')
                $.map(x.results, function(e) {        
                    const clone = $('#search_result button.prototype')
                                    .clone()
                                    .removeClass('prototype')   
                                    .attr('data-city', e.name)
                                    .attr('data-latitude', e.latitude.toFixed(4))
                                    .attr('data-longitude', e.longitude.toFixed(4))
                    
                    const city = [
                        '<img src="https://flagsapi.com/'+e.country_code+'/flat/24.png">',
                        e.name ,
                        '<span class="m-city-d">'+ e.country +'</span>'
                    ]
                    const coords = [
                        'Latitude: ' + e.latitude.toFixed(2),
                        'Longitude: '+ e.longitude.toFixed(2)
                    ]

                    clone.find('p.m-city').html(city.join(' '))
                    clone.find('.text-muted').html(coords.join(' '))

                    // clone.find('button').data('latitude', e.latitude)
                    
                    $('#search_result .list-group').append(clone)
                });
            } else {
                $('#search_result p.feedback').html('Nincs találat.')
            }
        })      
    }
}

function loadWeather(city, latitude,longitude) {
    if (latitude || longitude) {
        const url = "https://api.open-meteo.com/v1/forecast?latitude="+latitude+"&longitude="+longitude+"&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto"

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        }).done(function(x){
            console.log(x)
            // set localstorage
                const data = {
                    'city': city,
                    'latitude': latitude,
                    'longitude': longitude,
                }
                localStorage.setItem("meteoCity", JSON.stringify(data));

            // set current weather
            $(".actual-weather button.city").html(city)
            $(".actual-weather .actual-d").html(Math.round(x.current.temperature_2m))
            $(".actual-weather .wmo_desc").html(wmo[x.current.weather_code])

            // set day rows
            $('.daily-list').find('.one-day').not('.prototype').remove()

            const time          = x.daily.time
            const weather_code  = x.daily.weather_code
            const percent       = x.daily.precipitation_probability_max
            const min           = x.daily.temperature_2m_min
            const max           = x.daily.temperature_2m_max

            const sevenDays = []
            const sevenDaysMax = []

            for (let i = 0; i < 7; i++) {
                const clone = $('.daily-weather .one-day.prototype').clone().removeClass('prototype')

                    const currentDay = getDayName(time[i])
                    const currentDayMax = Math.round(max[i])

                    clone.find('.day').html(currentDay)
                    clone.find('.rain_probability .icon').html(getSVG(weather_code[i]))
                    clone.find('.rain_probability .percent').html(percent[i])
                    clone.find('.tempreture .min').html(Math.round(min[i]))
                    clone.find('.tempreture .max').html(Math.round(max[i]))

                $('.daily-list').append(clone)

                sevenDays.push(currentDay)
                sevenDaysMax.push(currentDayMax)
            }  
                                
            createChart(sevenDaysMax,sevenDays)

            $(".container").show()
            $('#staticBackdrop').modal('hide')
        })      
    }    
}

function createChart(max, sevenDays) {
    
    var options = {
        series: [{
            name: "Legmagasabb hőmérséklet",
            data: max,
      }],
        chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight'
      },
      title: {
        // text: 'Product Trends by Month',
        align: 'left'
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5
        },
      },
      xaxis: {
        categories: sevenDays,
      }
    };


    var chart = new ApexCharts(document.querySelector("#myChart"), options);
    chart.render();
}

function getDayName(date) {
    var days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    var d = new Date(date);
    return dayName = days[d.getDay()];    
}

// helper functions

const wmo = {
    // ---- Sun icon
    '0':  'Tiszta idő',
    '1':  'Túlnyomóan derült',
    '2':  'Részben felhős',
    '3':  'Borult idő',

    // ---- rain icon
    '45':	'Köd',
    '48':	'Képződő peremköd',
    '51':	'Enyhe szitáló eső',
    '53':	'Mérsékelt szitáló eső',
    '55':	'Szitáló eső',
    '56':	'Enyhe jégszitálás',
    '57':	'Sűrű jégszitálás',
    '61':	'Enyhe esőz',
    '63':	'Mérsékelt esőz',
    '65':	'Heves eső',
    '66':	'Enyhe jégeső',
    '67':	'Heves jégeső',
    '80':	'Enyhe záporeső',
    '81':	'Mérsékelt záporeső',
    '82':	'Heves záporeső',

    // ---- snow icon
    '71':   'Enyhe havayás',
    '73':   'Mérsékelt havayás',
    '75':   'Heves havayás',
    '77':   'Hószemcsék',
    '85':   'Enyhe hózápor',
    '85':   'Heves hózápor',

    // ---- thunder icon
    '95':   'Vihar',
    '96':   'Enyhe vihar jégesővel',
    '99':   'Vihar jégesővel'
}


function getSVG(code) {
    const sunny = [0,1,2,3]
    if (jQuery.inArray( code, sunny ) !== -1) {
        return '<svg width="15px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" fill="white"/></svg>'
    }

    const rainy = [45,48,51,53,55,56,57,61,63,65,66,67,80,81,82]
    if (jQuery.inArray( code, rainy ) !== -1) {
        return '<svg width="23" height="12" viewBox="0 0 23 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.3782 0C15.2517 0 17.4486 1.573 17.7676 3.474H17.865C20.3573 3.474 22.3782 4.711 22.3782 6.237C22.3782 7.763 20.3573 9 17.865 9L16.7399 8.999L16.7242 9.024L14.3937 11.728C14.3001 11.8378 14.1452 11.9214 13.9595 11.9621C13.7739 12.0029 13.571 11.998 13.3908 11.9483C13.2106 11.8986 13.0662 11.8078 12.986 11.6937C12.9058 11.5797 12.8956 11.4506 12.9575 11.332L13.014 11.249L14.9547 8.999H12.0429L12.0272 9.024L9.69674 11.728C9.60308 11.8378 9.44817 11.9214 9.26253 11.9621C9.0769 12.0029 8.874 11.998 8.69381 11.9483C8.51361 11.8986 8.36918 11.8078 8.28898 11.6937C8.20877 11.5797 8.1986 11.4506 8.26046 11.332L8.31703 11.249L10.2577 8.999H7.31917L4.98246 11.728C4.89428 11.8308 4.75224 11.9106 4.58109 11.9535C4.40994 11.9964 4.22054 11.9998 4.04589 11.963L3.91703 11.927C3.75563 11.8711 3.63013 11.7809 3.56238 11.6722C3.49462 11.5635 3.48889 11.4431 3.54617 11.332L3.60275 11.249L5.52775 8.999H4.89132C2.39903 8.999 0.378174 7.763 0.378174 6.237C0.378174 4.767 2.25132 3.566 4.61632 3.479L4.98875 3.474C5.31089 1.561 7.50617 0 11.3782 0Z" fill="white"/></svg>'
    }

    const snowy = [71,73,75,77,85,86]
    if (jQuery.inArray( code, snowy ) !== -1) {
        return '<svg width="14px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 0c17.7 0 32 14.3 32 32V62.1l15-15c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-49 49v70.3l61.4-35.8 17.7-66.1c3.4-12.8 16.6-20.4 29.4-17s20.4 16.6 17 29.4l-5.2 19.3 23.6-13.8c15.3-8.9 34.9-3.7 43.8 11.5s3.8 34.9-11.5 43.8l-25.3 14.8 21.7 5.8c12.8 3.4 20.4 16.6 17 29.4s-16.6 20.4-29.4 17l-67.7-18.1L287.5 256l60.9 35.5 67.7-18.1c12.8-3.4 26 4.2 29.4 17s-4.2 26-17 29.4l-21.7 5.8 25.3 14.8c15.3 8.9 20.4 28.5 11.5 43.8s-28.5 20.4-43.8 11.5l-23.6-13.8 5.2 19.3c3.4 12.8-4.2 26-17 29.4s-26-4.2-29.4-17l-17.7-66.1L256 311.7v70.3l49 49c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-15-15V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V449.9l-15 15c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l49-49V311.7l-61.4 35.8-17.7 66.1c-3.4 12.8-16.6 20.4-29.4 17s-20.4-16.6-17-29.4l5.2-19.3L48.1 395.6c-15.3 8.9-34.9 3.7-43.8-11.5s-3.7-34.9 11.5-43.8l25.3-14.8-21.7-5.8c-12.8-3.4-20.4-16.6-17-29.4s16.6-20.4 29.4-17l67.7 18.1L160.5 256 99.6 220.5 31.9 238.6c-12.8 3.4-26-4.2-29.4-17s4.2-26 17-29.4l21.7-5.8L15.9 171.6C.6 162.7-4.5 143.1 4.4 127.9s28.5-20.4 43.8-11.5l23.6 13.8-5.2-19.3c-3.4-12.8 4.2-26 17-29.4s26 4.2 29.4 17l17.7 66.1L192 200.3V129.9L143 81c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l15 15V32c0-17.7 14.3-32 32-32z" fill="white"/></svg>'
    }    
        
    const stormy = [95,99]
    if (jQuery.inArray( code, stormy ) !== -1) {
        return '<svg width="14px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 224c0 53 43 96 96 96h47.2L290 202.5c17.6-14.1 42.6-14 60.2 .2s22.8 38.6 12.8 58.8L333.7 320H352h64c53 0 96-43 96-96s-43-96-96-96c-.5 0-1.1 0-1.6 0c1.1-5.2 1.6-10.5 1.6-16c0-44.2-35.8-80-80-80c-24.3 0-46.1 10.9-60.8 28C256.5 24.3 219.1 0 176 0C114.1 0 64 50.1 64 112c0 7.1 .7 14.1 1.9 20.8C27.6 145.4 0 181.5 0 224zm330.1 3.6c-5.8-4.7-14.2-4.7-20.1-.1l-160 128c-5.3 4.2-7.4 11.4-5.1 17.8s8.3 10.7 15.1 10.7h70.1L177.7 488.8c-3.4 6.7-1.6 14.9 4.3 19.6s14.2 4.7 20.1 .1l160-128c5.3-4.2 7.4-11.4 5.1-17.8s-8.3-10.7-15.1-10.7H281.9l52.4-104.8c3.4-6.7 1.6-14.9-4.2-19.6z" fill="white"/></svg>'
    }     

    // return default if code missing - dont match
        return '<svg width="15px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" fill="white"/></svg>'    
}