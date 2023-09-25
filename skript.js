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

ctx.fillStyle = ctx.strokeStyle = gradient;


class Particle {
    constructor(effect, i){
        this.effect   = effect;
        this.elementRect = this.effect.element;
        this.indexs   = i;
        // параметри розміру і розміщення частинок
        this.radius   = Math.floor(Math.random() * 4 + 2);
        this.generateRandomPosition();
        // параметр швидкості руху частинок
        this.vx       = Math.random() * 4 - 1;
        this.vy       = Math.random() * 4 - 1;
        // параметри розгону частинок
        this.pushX    = 0;
        this.pushY    = 0;
        this.friction = .98;
    }
    //
    generateRandomPosition() {
        do {
            this.x = Math.random() * (this.effect.width - this.radius * 2) + this.radius;
            this.y = Math.random() * (this.effect.height - this.radius * 2) + this.radius;
        } 
        while (this.isInsideElement());
    }

    // Перевірка, чи частинка знаходиться всередині елемента
    isInsideElement() {
        return (
            this.x + this.radius > this.elementRect.left   &&
            this.x - this.radius < this.elementRect.right  &&
            this.y + this.radius > this.elementRect.top    &&
            this.y - this.radius < this.elementRect.bottom
        );
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
                this.pushX += Math.cos(this.angle) * this.force;
                this.pushY += Math.sin(this.angle) * this.force;
            };
        }

        this.x    += (this.pushX *= this.friction) + this.vx;
        this.y    += (this.pushY *= this.friction) + this.vy;


        
        // Обробка зіткнень з лівою-правою стороною екрану
        if(this.x < this.radius){
            this.x   = this.radius;
            this.vx *= -1;
        }else if(this.x > this.effect.width - this.radius){
            this.x   = this.effect.width - this.radius;
            this.vx *= -1;
        }

        // Обробка зіткнень з верхом-низом екрану
        if(this.y < this.radius){
            this.y   = this.radius;
            this.vy *= -1;
        }else if(this.y > this.effect.height - this.radius){
            this.y   = this.effect.height - this.radius;
            this.vy *= -1;
        }

        // Обробка зіткнень з елементом h1
        if (this.x + this.radius >= this.elementRect.left   &&
            this.x - this.radius <= this.elementRect.right  &&
            this.y + this.radius >= this.elementRect.top    &&
            this.y - this.radius <= this.elementRect.bottom){
               
                 // Зміна координат і швидкостей після зіткнення з елементом
                if (this.x < this.elementRect.left) {
                    this.x = this.elementRect.left - this.radius;
                    this.vx *= -1;
                } else if (this.x > this.elementRect.right) {
                    this.x = this.elementRect.right + this.radius;
                    this.vx *= -1;
                }

                if (this.y < this.elementRect.top ) {
                    this.y = this.elementRect.top  - this.radius;
                    this.vy *= -1;
                } else if (this.y > this.elementRect.bottom) {
                    this.y = this.elementRect.bottom + this.radius;
                    this.vy *= -1;
                }
                this.pushX = 0;
                this.pushY = 0;
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
                    this.vx *= -1;
                    this.vy *= -1;
                }
            }
        }
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
               
                this.gradient   = ctx.createLinearGradient(0, 0, this.effect.width, this.effect.height);
                this.gradient.addColorStop(0, 'transparent');
                this.gradient.addColorStop(0.5,'gold');
                this.gradient.addColorStop(1, 'orangered');

                ctx.globalAlpha = .6;
                ctx.strokeStyle = this.gradient;
                ctx.lineWidth = .1;

                ctx.beginPath();
                ctx.moveTo   (this.x, this.y);
                ctx.lineTo   (this.effect.mouse.x, this.effect.mouse.y);
                ctx.stroke   ()

            ctx.restore ();
        }
    }

}

class Effect {
    constructor(canvasMS, ctx){
        this.canvas            = canvasMS;
        this.ctx               = ctx;
        // Параметри розмірів полотна
        this.width             = this.canvas.width;
        this.height            = this.canvas.height;
        // Параметри зміни розмірів 
        this.dw = this.width  / screenWidth;
        this.dh = this.height / screenHeight;
        this.scale =  Math.min(this.dw, this.dh);

        this.particles         = [];
        this.numberOfParticles = 150;                   //параметр кількості частинок
        this.maxDistance       = 100;                   //параметр відстані між частинками
        
        this.debug             = false;
        this.element           = document.getElementById('developer').getBoundingClientRect();
        console.log(this.element );

        // початкові параметри наведення курсора
        this.mouse             = {
                                   x:       0,
                                   y:       0,
                                   pressed: false,
                                   radius:  150,
                                };
                                
        this.createParticles();
        
        // зміна розмірів екрана
        window.addEventListener('resize', (e) => {
            this.resize(e.target.window.innerWidth, e.target.window.innerHeight);
        });
        
        // ====================Блок керування клавіатурою =======================>
        // вкл. конструктор зіткнення з елементами
        body.addEventListener('keydown', e => {
            if(['D', 'd', 'В', 'в'].includes(e.key)){
                this.debug = !this.debug;
            }
        })
        
        // ====================Блок керування мишкою =======================>
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

        // ==================== Блок керування  touchPad=======================>
        // натиснули ліву кнопку миші
        canvasMS.addEventListener('touchstart', e =>{
            this.mouse.pressed = true;
            this.mouse.x = e.changedTouches[0].pageX;
            this.mouse.y = e.changedTouches[0].pageY;
        });
        // рух з натиснутою лівою кнопкою миші
        canvasMS.addEventListener('touchmove', e =>{
            if(this.mouse.pressed){
                this.mouse.x = e.changedTouches[0].pageX;
                this.mouse.y = e.changedTouches[0].pageY;
            }
        });
        // відпустили ліву кнопку миші
        canvasMS.addEventListener('touchend', () =>{
            this.mouse.pressed = false;
        });
        
       
    }

    // Функція зміни параметрів при зміні розмірів монітора
    resize(width, height){
        this.canvas.width    = width;
        this.canvas.height   = height;

        this.width           = width;
        this.height          = height;

        this.element         = document.getElementById('developer').getBoundingClientRect();
        
        this.gradient        = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        this.ctx.fillStyle   = gradient;
        this.ctx.strokeStyle = gradient;
    
        this.particles.forEach(particle => particle.generateRandomPosition());
        // this.particles.forEach(particle => particle.update());
        // this.particles.forEach(particle => particle.update());
    }

    createParticles(){
        for (let i = 0; i < this.numberOfParticles; ++i){
            this.particles.push(new Particle(this, i));
        }
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
                        // задаємо параметри лінії
                        this.opacity         = 1 - (this.distance / this.maxDistance);                        // чим дальше частинки одна від оної тим прозоріші
                        this.ctx.globalAlpha = this.opacity;
                        this.ctx.strokeStyle = gradient;                                                      // задаємо параметр коліру лінії  
                        this.ctx.lineWidth   = .6;
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

    handleParticles(){
        this.connectParticles();
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
            particle.update();
        })

        if(this.debug){
            this.ctx.save      ();
            this.ctx.strokeStyle = 'blue';
            this.ctx.strokeRect(this.element.x, this.element.y, this.element.width, this.element.height);
            this.ctx.restore   ();
        }
    }
}

const effect = new Effect(canvasMS, ctx);

function animate(){
    ctx.clearRect(0, 0, canvasMS.width, canvasMS.height);
    effect.handleParticles();
    requestAnimationFrame(animate);
}

animate()




