const ctx          = canvasMS.getContext('2d', { willReadFrequently: true });

const body         = document.body;
const screenWidth  = window.screen.width;
const screenHeight = window.screen.height;
canvasMS.width     = window.innerWidth;
canvasMS.height    = window.innerHeight;


const gradient     = ctx.createLinearGradient(0, 0, canvasMS.width, canvasMS.height);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(0.5,'gold');
      gradient.addColorStop(1, 'orangered');

ctx.fillStyle   = gradient;
ctx.strokeStyle = gradient;

class Particle {
    constructor(effect, i){
        this.effect   = effect;
        this.indexs   = i;
        // параметри розміру і розміщення частинок
        // this.radius   = Math.floor(Math.random() * 4 + .5);
        this.radius   = Math.floor(Math.random() * 4 + .5) * this.effect.scale;
        this.x        = Math.random() * (this.effect.width  - this.radius * 2) + this.radius;  
        this.y        = Math.random() * (this.effect.height - this.radius * 2) + this.radius;
        // параметр швидкості руху частинок
        this.vx       = Math.random() * 10 - 4;
        this.vy       = Math.random() * 10 - 4;
        // параметри розгону частинок
        this.pushX    = 0;
        this.pushY    = 0;
        // 
        this.friction = .95;
    }

    // Функція малювання типу частинок
    draw(){
        // малюємо коло
        ctx.beginPath ();
        ctx.arc       ( this.x, 
                        this.y, 
                        this.radius, 
                        0, 
                        Math.PI * 2 );
        ctx.fill      (); 
        ctx.stroke    ();   

        // створюємо ефект сонячних променів для кожно 4 - ої частинки
        if(this.indexs % 1 === 0 && this.effect.mouse.pressed){
            ctx.save     ();
                    
                ctx.globalAlpha = .6;

                this.gradient   = ctx.createLinearGradient(0, 0, this.effect.width, this.effect.height);
                this.gradient.addColorStop(0, 'white');
                this.gradient.addColorStop(0.5,'gold');
                this.gradient.addColorStop(1, 'orangered');

                ctx.strokeStyle = this.gradient;

                ctx.lineWidth = .1; // Початкова товщина лінії (тонка)

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.effect.mouse.x, this.effect.mouse.y);

                ctx.stroke()

            ctx.restore  ();
        }
    }

    // Функція руху частинок (оновлення значення розміщення частинок)
    update(){

        if(this.effect.mouse.pressed){
            this.dx       = this.x - this.effect.mouse.x;
            this.dy       = this.y - this.effect.mouse.y;
            this.distance = Math.hypot(this.dx, this.dy);
            this.force    = this.effect.mouse.radius / this.distance;
            if(this.distance < this.effect.mouse.radius){
                this.angle  = Math.atan2(this.dy, this.dx);
                this.pushX += Math.cos(this.angle) * this.force * 10;
                this.pushY += Math.sin(this.angle) * this.force * 10;
            };
        }

        this.y    += (this.pushY *= this.friction) + this.vy;
        this.x    += (this.pushX *= this.friction) + this.vx;
        // умоване не виходу за ліво-право
        if(this.x < this.radius){
            this.x   = this.radius;
            this.vx *= -1;
        }else if(this.x > this.effect.width - this.radius){
            this.x   = this.effect.width - this.radius;
            this.vx *= -1;
        }
        //    умова не виходу за верх-низ
        if(this.y < this.radius){
            this.y   = this.radius;
            this.vy *= -1;
        }else if(this.y > this.effect.height - this.radius){
            this.y   = this.effect.height - this.radius;
            this.vy *= -1;
        }
        
        // Обробка зіткнень з іншими частинками
        for (let i = 0; i < this.effect.particles.length; ++i){
            if (i !== this.indexs) {
                this.otherParticle = this.effect.particles[i];
                this.dx            = this.otherParticle.x - this.x;
                this.dy            = this.otherParticle.y - this.y;
                this.distance      = Math.hypot(this.dx, this.dy);
                if (this.distance < this.radius + this.otherParticle.radius) {
                    // Зміна швидкостей після зіткнення
                    // const angle = Math.atan2(this.dy, this.dx);
                    this.vx *= -1;
                    this.vy *= -1;
                }
            }
        }
    }
    // функція оновлення значень під час зміни розмірів екрану
    reset(){
        this.radius = (Math.random() * 4 + .5) * this.effect.scale;
        this.x      = Math.random() * (this.effect.width  - this.radius * 2) + this.radius;  
        this.y      = Math.random() * (this.effect.height - this.radius * 2) + this.radius;
    }
}

class Effect {
    constructor(canvasMS, ctx){
        this.canvas            = canvasMS;
        this.ctx               = ctx;
        // Параметри розмірів полотна
        this.width             = this.canvas.width;
        this.height            = this.canvas.height;
        this.particles         = [];
        // Параметри зміни розмірів 
        this.dw = this.width  / screenWidth;
        this.dh = this.height / screenHeight;
        this.scale =  Math.min(this.dw, this.dh);
      
        this.numberOfParticles = 50;                   //параметр кількості частинок
        this.maxDistance       = 200;                   //параметр відстані між частинками
        // this.maxDistance       = 100 * this.scale;

        // початкові параметри наведення курсора
        this.mouse             = {
                                   x:       0,
                                   y:       0,
                                   pressed: false,
                                   //    radius:  100,
                                   radius:  100 * this.scale,
                                };
        this.collision = false;
        console.log(this.particles)
                                

        // зміна розмірів екрана
        window.addEventListener('resize', (e) => {
            this.resize(e.target.window.innerWidth, e.target.window.innerHeight);
        });
        // натиснули ліву кнопку миші
        canvasMS.addEventListener('mousedown', e =>{
            this.mouse.pressed = true;
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });
        // рух з натиснутою лівою кнопкою миші
        canvasMS.addEventListener('mousemove', e =>{
            if(this.mouse.pressed){
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            }
        });
        // відпустили ліву кнопку миші
        canvasMS.addEventListener('mouseup', () =>{
            this.mouse.pressed = false;
        });
        this.createParticles();
    }

    // Функція зміни параметрів при зміні розмірів монітора
    resize(width, height){
        this.canvas.width    = width;
        this.canvas.height   = height;

        this.width           = width;
        this.height          = height;

        // this.maxDistance     = 100 * this.scale;
        // this.mouse.radius    = 150 * this.scale;

        this.gradient        = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        this.ctx.fillStyle   = gradient;
        this.ctx.strokeStyle = gradient;
        // this.ctx.lineWidth   = .2;

        this.particles.forEach(particle => particle.reset());
    }

    createParticles(){
        for (let i = 0; i < this.numberOfParticles; ++i){
            this.particles.push(new Particle(this, i));
        }
    }

    handleParticles(){
        this.connectParticles();
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
            particle.update();
        })
    }

    // Функція зєднання двох частинок лінією
    connectParticles(){
        for (let a = 0; a < this.particles.length; ++a){
            for (let b = 0; b < this.particles.length; ++b){
                this.dx       = this.particles[a].x - this.particles[b].x;   // Визначаємо відстань між двома частинками по осі Х
                this.dy       = this.particles[a].y - this.particles[b].y;   // Визначаємо відстань між двома частинками по осі Y
                this.distance = Math.hypot(this.dx, this.dy);                // Обчислюємо гіпотенузу 
               
                if(this.distance < this.maxDistance){
                    //  зєднюємо дві частинки якщо виконуєьбся умова (обчислина гіпотенуза менщка за вказана дистанцію)
                    this.ctx.save     ();
                        // задаємо параметри прозорості
                        this.opacity         = 1 - (this.distance / this.maxDistance);                        // чим дальше частинки одна від оної тим прозоріші
                        this.ctx.globalAlpha = this.opacity;

                        
                        this.gradient        = this.ctx.createLinearGradient(0, 0, this.width, this.height);  // встановлюємо градієнт(зміна кольору) від лівого-верхнього кута до правго нижнього
                        this.gradient.addColorStop(0, 'white');                                               // початкове значення кольору (у лівому верхньому куті)
                        this.gradient.addColorStop(0.5,'gold');                                               // проміжне (на 50%) значення кольору (повередині)         
                        this.gradient.addColorStop(1, 'orangered');                                           // кінцеве значення кольору (у правому нижньому куті)

                        this.ctx.strokeStyle = this.gradient;                                                 // задаємо параметр коліру лінії  
                        this.ctx.lineWidth   = .2;
                        // малюємо лінію
                        this.ctx.beginPath();
                        
                        this.ctx.moveTo   (this.particles[a].x, this.particles[a].y);                         // початкові коорднати (центри чатинки а)
                        this.ctx.lineTo   (this.particles[b].x, this.particles[b].y);                         // кінцеві коорднати (центри чатинки b)
                        this.ctx.stroke   ();
                    this.ctx.restore  ();
                }
            }
        }
    }

}

const effect = new Effect(canvasMS, ctx);

console.log(effect);

function animate(){
    ctx.clearRect(0, 0, canvasMS.width, canvasMS.height);
    effect.handleParticles();
    requestAnimationFrame(animate);
}

animate()




