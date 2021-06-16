//función para llamar api y retornar data
const getAPI = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/total");
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.log(error);
    }
}

//función recibe data de API
const printGlobalData = async () => {
    const response = await getAPI();
    //Filtra los paises con más de 10.000 casos
    const arregloFiltrado = response.filter((e) => e.active > 10000)
    //Se itera con .map y configura la columna confirmados, activos, recuperados y fallecidos por país.
    const barCharData = {
        labels: arregloFiltrado.map(p => p.location),
        datasets: [{
                label: 'Confirmados',
                backgroundColor: '#AC66CC',
                data: arregloFiltrado.map(p => p.confirmed)
            },
            {
                label: 'Activos',
                backgroundColor: '#ff96ad',
                data: arregloFiltrado.map(p => p.active)
            },
            {
                label: 'Recuperados',
                backgroundColor: '#005a8d',
                data: arregloFiltrado.map(p => p.recovered)
            },
            {
                label: 'Fallecidos',
                backgroundColor: '#022e57',
                data: arregloFiltrado.map(p => p.deaths)
            },
        ]
    }

    
    globalChart(barCharData);
   

    //se itera e imprime la tabla con los paises y sus respectivos casos
    response.forEach((element, i) => {
        let location = element.location
        let confirmed = element.confirmed
        let deaths = element.deaths
        let recovered = element.recovered
        let active = element.active
        $('#tbody').append(`
        <tr>
        <th scope="row">${i+1}</th>
        <td>${location}</td>
        <td>${confirmed}</td>
        <td>${deaths}</td>
        <td>${recovered}</td>
        <td>${active}</td>
        <td><button id="${location}" class="btn botonDetalle btn-primary" data-toggle="modal" data-target="#exampleModal">Ver Detalle</button></td>
      </tr>`)
    })

}


//funcion de configuración de grafico situacion mundial covid
const globalChart = (barCharData) => {
    var ctx = document.getElementById('myChart').getContext('2d');
    window.myBarChart = new Chart(ctx, {
        type: 'bar',
        data: barCharData,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Situación Mundial COVID-19',
                    font: {
                        size: 40,
                    }
                }
            }
        }
    });
}

printGlobalData();

//funcion click para imprimir modal
$(document).ready(function () {
    $(document).on('click', '.botonDetalle', async function () {
        //se obtiene el id del boton clickeado
        const idlocation = $(this).attr('id');
        //se llama a la API interpolando el pais clickeado
        const response = await fetch(`http://localhost:3000/api/countries/${idlocation}`)
        const {data} = await response.json();

        //configuracion de los datos para el grafico de torta del modal
        const pieCharData = {
            datasets: [{
                data: [data.active, data.deaths, data.recovered, data.confirmed],
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56']
            }],
            labels: [
                'Activos',
                'Muertos',
                'Recuperados',
                'Confirmados'
            ]
        };

        const titleModal = data.location
        const bodyModal = modalChart(pieCharData);
        $('#modalTitle').html(titleModal)
        $('#modalBody').html(bodyModal)
    });
});

//funcion de configuracion e impresion de grafico de torta en modal
const modalChart = (pieCharData) => {
    var ctx = document.getElementById('myChartModal');
    if (window.myDougChart) {
        window.myDougChart.destroy();
    }
    window.myDougChart = new Chart(ctx, {
        type: 'doughnut',
        data: pieCharData
    });
}

//funcion que trae la data de chile e imprime gráfico situacion Chile
const ChileChartData = async() => {
    const chileConfirmados = await getChileConfirmed();
    const chileFallecidos = await getChileDeath();
    const chileRecuperados = await getChileRecovered();

    const lineCharData = {
        labels: chileConfirmados.map(p => p.date),
        datasets: [{
                label: 'Confirmados',
                backgroundColor: '#9ad3bc',
                fill: false,
                data: chileConfirmados.map(p => p.total)
            },
            {
                label: 'Fallecidos',
                backgroundColor: '#f3eac2',
                fill: false,
                data: chileFallecidos.map(p => p.total)
            },
            {
                label: 'Recuperados',
                backgroundColor: '#f5b461',
                fill: false,
                data: chileRecuperados.map(p => p.total)
            },
        ]
    }
   //funcion de configuración de grafico situacion Chile 
   const chileChart = (lineCharData) => {
    var ctx = document.getElementById('myChartChile').getContext('2d');
    window.myBarChart = new Chart(ctx, {
        type: 'line',
        data: lineCharData,
        fill: false,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Situación Chile COVID-19',
                    font: {
                        size: 40,
                    }
                }
            }
        }
    });
}

chileChart(lineCharData);
}

$('#submitForm').submit(async (event) => {
    event.preventDefault()
    //se obtienen los valores del login (mail y password)
    const email = document.getElementById('InputEmail').value
    const password = document.getElementById('InputPassword').value
    //se ejecuta la funcion postData enviando el email y el password. Este retornará el token
    await postData(email, password)
    await ChileChartData()
})

const postData = async (email, password) => {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        const {token} = await response.json()
        console.log(token)
        if (token) {
            console.log(`"Hay token"${token}`)
            localStorage.setItem('jwt-token', token)
            $('.alert-danger').addClass('d-none');
            $('#SesionModal').modal('hide');
            $('#logInButton').addClass('d-none');
            $('#chilebutton').removeClass('d-none');
            $('#graficoMundial').addClass('d-none');
            $('#tabla').addClass('d-none');
            $('#logOutButton').removeClass('d-none');
            $('#load').removeClass('d-none');
        } else {
            $('.alert-danger').removeClass('d-none');
        }
        return token
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

//función que llama a la api que retorna los casos confirmados de Chile
const getChileConfirmed = async () => {
    try {
        const token = localStorage.getItem('jwt-token')
        const response = await fetch('http://localhost:3000/api/confirmed', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const {
            data
        } = await response.json()
        return data
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

//función que llama a la api que retorna los fallecidos de Chile
const getChileDeath = async () => {
    try {
        const token = localStorage.getItem('jwt-token')
        const response = await fetch('http://localhost:3000/api/deaths', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const {
            data
        } = await response.json()
        return data
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

//función que llama a la api que retorna los casos recuperados de Chile y oculta el load (cargando y spinner)
const getChileRecovered = async () => {
    try {
        const token = localStorage.getItem('jwt-token')
        const response = await fetch('http://localhost:3000/api/recovered', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const {
            data
        } = await response.json()
        return data
    } catch (err) {
        console.error(`Error: ${err}`)
    } finally {
        $('#load').addClass('d-none');
    }
}

//función click cuando presiona en home para mostrar el grafico y tabla mundial y ocultar el gráfico de Chile
$('#home').click(async function () {
    $('#graficoMundial').removeClass('d-none');
    $('#tabla').removeClass('d-none');
    $('#graficoChile').addClass('d-none');
})

//funcion click cuando presiona en "casos chile" para ocultar grafico y tabla mundial y mostrar grafico de Chile
$('#chilebutton').click(async function () {
    $('#graficoMundial').addClass('d-none');
    $('#tabla').addClass('d-none');
    $('#graficoChile').removeClass('d-none');
})

// funcion click cuando presiona "cerrar sesion" para ocultar grafico de chile y mostrar grafico y tabla mundial.
//Ademas, elimina el token del localStorage y recarga la página.
$('#logOutButton').click(async function () {
    $('#graficoMundial').removeClass('d-none');
    $('#tabla').removeClass('d-none');
    $('#graficoChile').addClass('d-none');
    localStorage.removeItem("jwt-token");
    location.reload();
})

//funcion cuando se recarga la página con token válido en localStorage. Para cargar el grafico de chile y no solicitar
//nuevamente el login.
$(document).ready(async function () {
    const token = localStorage.getItem("jwt-token");
    if (token) {
        console.log(`"Hay token"${token}`)
        $('.alert-danger').addClass('d-none');
        $('#SesionModal').modal('hide');
        $('#logInButton').addClass('d-none');
        $('#chilebutton').removeClass('d-none');
        $('#graficoMundial').removeClass('d-none');
        $('#tabla').removeClass('d-none');
        $('#logOutButton').removeClass('d-none')
        await ChileChartData();
    }
});