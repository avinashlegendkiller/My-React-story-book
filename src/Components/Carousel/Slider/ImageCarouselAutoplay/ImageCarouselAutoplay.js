import React, {Component} from 'react';
import './ImageCarousel.css';
import data from './data.json';
import scrollTo from './../scrollToAnimate';
import throttle from 'lodash.throttle';
import classnames from 'classnames';

function Slide(props) {
    // {
    // "url": "/wiki/Zambia",
    // "alpha3": "ZMB",
    // "file_url": "//upload.wikimedia.org/wikipedia/commons/0/06/Flag_of_Zambia.svg",
    // "name": "Zambia",
    // "license": "Public domain"
    // }

    const {url,alpha3,file_url,name,license, image} = props.country;
    return(
        <div className="slide image-slide boxshadow image-autoplay-carousel" style={{height: 300, width: `100%`}}>
            <div className="slide-div-background-image-full" style={{width: `100%`, height: `100%`, backgroundImage: `url('${image}')`}}></div>
        </div>
    )
}

class ImageCarouselAutoplay extends Component {
    constructor(props) {
        super(props);
        this.animatingLeft = false;
        this.animatingRight = false;
        this.timerId = 0;

        this.autoplayDuration = 6000;
        this.sleepDuration = 500;

        this.state = {
            numberOfSlidesToScroll: 'full',
            allTheWayLeft: false,
            allTheWayRight: false,
            time: 0
        }
    }

    componentDidMount() {
        //call this to determine carousel buttons state
        this.checkIfSlidesAllTheWayOver();

        //call this when component has mounted, inorder to determine innerWidth
        //this.checkNumberOfSlidesToScroll();

        window.addEventListener("resize", throttle(this.onResize, 250));
        window.addEventListener("keydown", this.onKeydown);

        //autoplay
        this.startTimer()
    }

    componentWillUnmount() {
        window.removeEventListener("resize", throttle(this.onResize, 250));
        
        this.clearTimer();
    }

    onResize = () => {
        this.checkNumberOfSlidesToScroll();

        //init autoplay
        const initAutoplayFlag = true;
        this.pauseTimer(initAutoplayFlag);
    }

    startTimer = () => {
        this.timerId = setInterval(()=>{this.handleRightNav()}, this.autoplayDuration);
    }

    pauseTimer = (initAutoplayFlag) => {
        this.clearTimer();

        if(initAutoplayFlag) {
            //Note: Hack --> make carousel display 1st element - inorder to avoid responsive width problems
            const {carouselViewport} = this.refs;
            carouselViewport.scrollLeft = 0;
        }
    }

    stopTimer = () => {
        clearInterval(this.timerId);
    }

    clearTimer = () => {
        clearInterval(this.timerId);
        this.timerId = setInterval(()=>{this.handleRightNav()}, this.autoplayDuration);
    }

    onKeydown = (event) => {
        const {keyCode} = event;
        let leftArrow = keyCode === 37;
        let rightArrow = keyCode === 39;

        if(leftArrow && !this.state.allTheWayLeft) { //left-arrow && not all the way left
            if(!this.animatingLeft) {
                //helps to avoid listening more than 1 keyboard input till animatingLeft becomes false, when carousel is animating using Promise
                this.animatingLeft = true;
                this.handleLeftNav()
                    .then(()=>{
                        this.animatingLeft = false;
                    });
            }
            
        }
        else if(rightArrow) {
            if(!this.animatingRight && !this.state.allTheWayRight) { //right-arrow && not all the way right
                //helps to avoid listening more than 1 keyboard input till animatingLeft becomes false, when carousel is animating using Promise
                this.animatingRight = true;
                this.handleRightNav()
                    .then(()=>{
                        this.animatingRight = false;
                    })
            }
        }
    }

    onScrollCarousel = (event) => {
        this.checkIfSlidesAllTheWayOver();
    }

    checkIfSlidesAllTheWayOver = () => {
        const {carouselViewport} = this.refs;
        let allTheWayLeft = false, allTheWayRight = false; //default

        //allTheWayLeft
        if(carouselViewport.scrollLeft === 0) {
            allTheWayLeft = true;
        }

        //allTheWayRight: if scrollLeft + length Of ViewPort offsetWidth === real length of viewport
        //for 10 carousel-items each of width 100. 10 * 100 === real length of viewport
        let amountScrolled = carouselViewport.scrollLeft;
        let viewPortLength = carouselViewport.clientWidth;
        //scrolled distance + viewport width
        let scrolled_plus_viewportlength = amountScrolled + viewPortLength;

        //total width of complete carousel
        let totalWidthOfCarousel = carouselViewport.scrollWidth;
        
        if(scrolled_plus_viewportlength === totalWidthOfCarousel) {
            allTheWayRight = true;
        }

        if(this.state.allTheWayLeft !== allTheWayLeft || this.state.allTheWayRight !== allTheWayRight) {
            this.setState({allTheWayLeft, allTheWayRight});
        }
        
        //handle all the way left/right carousel autoplay
        if(allTheWayRight) {
            //sleep & start after some time (duration)
            this.sleep(this.sleepDuration).then(()=>{
                this.stopTimerAndStartLeftCarouselAutoplay()
            })
        } 
        else if(allTheWayLeft) {
            //sleep & start after some time (duration)
            this.sleep(this.sleepDuration).then(()=>{
                this.stopTimerAndStartRightCarouselAutoplay()
            })
        }
    }

    //sleep function in js
    sleep = (time) => {
        return new Promise((resolve)=>setInterval(resolve, time))
    }

    checkNumberOfSlidesToScroll = () => {
        var numberOfSlidesToScroll;

        if(window.innerWidth <= 900) {
            numberOfSlidesToScroll = 'full';
        }
        else {
            numberOfSlidesToScroll = 'full';
        }

        if(this.state.numberOfSlidesToScroll !== numberOfSlidesToScroll) {
            // single object in set state, skip writing {numberOfSlidesToScroll: numberOfSlidesToScroll}
            this.setState({numberOfSlidesToScroll});
        }
    }

    widthAndTimeToScroll = () => {
        const {carouselViewport} = this.refs;
        
        return {
            widthToScroll: carouselViewport.offsetWidth,
            timeToScroll: 400
        }
    }

    renderSlides() {
        return data.map((country, index)=>{
            return(
                <Slide country={country} key={index}/>
            )
        });
    }

    stopTimerAndStartLeftCarouselAutoplay = () => {
        this.stopTimer();
        this.timerId = setInterval(()=>{this.handleLeftNav()}, this.autoplayDuration);
    }

    stopTimerAndStartRightCarouselAutoplay = () => {
        this.stopTimer();
        this.timerId = setInterval(()=>{this.handleRightNav()}, this.autoplayDuration);
    }

    handleLeftNavWithPromise = () => {
        //pause autoplay
        this.pauseTimer();

        if(!this.animatingLeft && !this.state.allTheWayLeft) {
            //helps to avoid listening more than 1 keyboard input till animatingLeft becomes false, when carousel is animating using Promise
            this.animatingLeft = true;
            this.handleLeftNav()
                .then(()=>{
                    this.animatingLeft = false;
                });
        }
    }

    handleRightNavWithPromise = () => {
        //pause autoplay
        this.pauseTimer();

        if(!this.animatingRight && !this.state.allTheWayRight) { //right-arrow && not all the way right
            //helps to avoid listening more than 1 keyboard input till animatingLeft becomes false, when carousel is animating using Promise
            this.animatingRight = true;
            this.handleRightNav()
                .then(()=>{
                    this.animatingRight = false;
                })
        }
    }

    handleLeftNav = () => {
        //take this.refs into a const/var
        const {carouselViewport} = this.refs;

        let { widthToScroll, timeToScroll } = this.widthAndTimeToScroll();

        let newPosition = carouselViewport.scrollLeft - widthToScroll;

        //scroll with animation
        let promise = scrollTo({
            element: carouselViewport, 
            to: newPosition, 
            duration: timeToScroll, 
            scrollDirection: 'scrollLeft',
            callback: this.checkIfSlidesAllTheWayOver,
            context: this
        });
        return promise;
    }

    handleRightNav = () => {
        //take this.refs into a const/var
        const {carouselViewport} = this.refs;

        let {widthToScroll, timeToScroll} = this.widthAndTimeToScroll();

        let newPosition = carouselViewport.scrollLeft + widthToScroll;

        //scroll with animation
        let promise = scrollTo({
            element: carouselViewport, 
            to: newPosition, 
            duration: timeToScroll, 
            scrollDirection: 'scrollLeft',
            callback: this.checkIfSlidesAllTheWayOver,
            context: this
        });
        return promise;
    }

    render() {
        const {allTheWayLeft, allTheWayRight} = this.state;
        const navClasses = classnames({
            'image-carousel-nav': true,
            'btn-round': true,
            'display-flex-center': true
        });
        const leftNavClasses = classnames({
            'carousel-left-nav': true,
            'image-carousel-left-nav': true,
            'carousel-nav-disabled': allTheWayLeft
        }, navClasses);
        const rightNavClasses = classnames({
            'carousel-right-nav': true,
            'image-carousel-right-nav': true,
            'carousel-nav-disabled': allTheWayRight
        }, navClasses);

        return(
            <div className="display-flex-center">
                <div className="carousel-container image-carousel-container" style={{width: `100%`}}>
                    <div className={leftNavClasses} onClick={this.handleLeftNavWithPromise}>
                        <span><i className="fas fa-chevron-left fa-sm"></i></span>
                    </div>

                    {/* disabling horizontal scroll */}
                    <div
                    style={{overflowX: 'hidden'}}
                    className="carousel-viewport" 
                    ref="carouselViewport"
                    onScroll={throttle(this.onScrollCarousel, 250)}>
                        {this.renderSlides()}
                    </div>

                    <div className={rightNavClasses} onClick={this.handleRightNavWithPromise}>
                        <span><i className="fas fa-chevron-right fa-sm"></i></span>
                    </div>
                </div>
            </div>
        )
    }
}
export default ImageCarouselAutoplay;