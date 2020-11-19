const socket = io()

// Elements
const $messageForm = document.querySelector('#message')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton =  $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const { username, room } = Qs.parse(location.search,{ ignoreQueryPrefix:true })

const autoscroll = () => {
    //Newest message element
    const $newMessage = $messages.lastElementChild

    //height of  the message
    const newMessageStyles = getComputedStyle($newMessage) 
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = ($newMessage.offsetHeight) + newMessageMargin + 1 // 1 for safety of float->int 

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages continer
    const containerHeight = $messages.scrollHeight
   
    //how far have I scroolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
   
}

socket.on('message',(data) => {
    const html = Mustache.render(messageTemplate,{
        username:data.username,
        message:data.text,
        createdAt: moment(data.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(data) => {
    const html = Mustache.render(locationMessageTemplate,{
        username:data.username,
        url:data.url,
        createdAt: moment(data.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    // disable
    $messageFormButton.setAttribute('disabled','disabled')
    const message =  e.target.elements.message.value //document.querySelector('[name=message]').value
    socket.emit('message',message, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
    
        
        if(error){
            return console.log(error)
        }
        console.log('A message send successfully')
    })  
})

$sendLocationButton.addEventListener('click', () =>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        const data = {latitude:position.coords.latitude,longitude:position.coords.longitude}
        socket.emit('shareLocation',data,()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }  
})