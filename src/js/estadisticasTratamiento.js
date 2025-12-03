const API_URL = 'http://192.168.1.17:7001/api/estadisticas/tratamiento-vs-sanos';

async function cargarEstadisticas() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Error al cargar los datos');
        }
        
        const data = await response.json();
        
        mostrarEstadisticas(data);
        
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error: ' + error.message;
    }
}

function mostrarEstadisticas(data) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    
    const total = data.enTratamiento + data.sanos;
    document.getElementById('totalAnimales').textContent = total;
    document.getElementById('enTratamiento').textContent = data.enTratamiento;
    document.getElementById('sanos').textContent = data.sanos;
    
    crearGraficaPastel(data);
    crearGraficaBarras(data);
}


function crearGraficaBarras(data) {
    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['En Tratamiento', 'Sanos'],
            datasets: [{
                label: 'Cantidad de Animales',
                data: [data.enTratamiento, data.sanos],
                backgroundColor: [
                    '#ff6b6b',
                    '#4ecdc4'
                ],
                borderColor: [
                    '#ff5252',
                    '#3dbdb3'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Cantidad: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}


cargarEstadisticas();