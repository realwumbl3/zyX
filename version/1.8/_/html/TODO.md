



## EVENTS HAVE A CUSTOM EVENT OBJECT PASSED IN (COMPLETED!)
# events binded with zyx- have a special event object passed in. 
# zyx-click=${(e) => {}}
# e = {
    e/event: original event,
    rest is the zyXHTML object 
}
# achieve this using a proxy
## end




## OUR OWN GOD DAMNED REF THINGAMABOB (CUMDEPLETED!)



const boats = dynamic(69);

accessible methods:

boats.set(newValue)


html`
    <div how-many-boats=${boats}>
        i have ${boats}, and that's tooooooo many boats.
    </div>
    <div zyx-click=${
    ()=> boats.set(boats.value + 1) 
    }
    > BUY MORE BOAT</div>
`

if it's an attribute find the name of it and update it when set is called.

if it's in content, make a fucking <span> tag with the content in it that

again reactively updates tabarnak.

put all the code osti for the dynamic function thing in it's own fileamabob.

keep changes in zyX-HTML TO A MINIMUM. functions to do processing of this attribute type should also be in the new file to keep clutter in zyX-HTML to a minimum. 


## end