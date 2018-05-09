/*
File: Convert Text to Hyperlinks.js
Description: This script searches for hyperlink text in the Layout, and converts it to QuarkXPress hyperlinks. You may configure the options to decide whether Mails, Urls, IPs and Files need to be processed.
*/

//Configure Options
var linkMails = true;
var linkUrls = true;
var linkIPs = true;
var linkFiles = true;

//Load the "AnchorMe" library https://github.com/alexcorvi/anchorme.js
if (typeof anchorme != "function") {
    //Load the Script
    app.importScript(app.getAppScriptsFolder() + "/Dependencies/anchorme.js");
    console.log("Loaded library anchorme.js.");
}

//import basic checks
if (typeof (isLayoutOpen) == "undefined") {
    //import basic checks
    app.importScript(app.getAppScriptsFolder() + "/Dependencies/qx_validations.js");
    console.log("Loaded library qx_validations.js for basic validation checks from application.");
}

//call the function to process data
convertAllToHyperlink().then((data) => { console.log(data); alert(data); });

/* Function to Search through all text nodes on the layout and convert the text to hyperlinks, if not linked already
*/
function convertAllToHyperlink() {
    let linkCount = 0;
    let errMsg = "No hyperlinks created.";
    let promise = new Promise(function (resolve, reject)//promise is used to ensure this task completes and return a promise followed by further execution
    {

        if (isLayoutOpen()) {
            //Get the LayoutDOM
            console.log("Getting Layout DOM.");
            let layoutDOM = app.activeLayoutDOM();
            if (null === layoutDOM) {
                errMsg = "Unable to load layout DOM. Please try again.";
                alert(errMsg);
            }
            else {
                let boxTextSpans = layoutDOM.querySelectorAll('qx-span');

                if (null === boxTextSpans || undefined === boxTextSpans || boxTextSpans.length <= 0) {
                    //No Text Box
                    errMsg = "No text found on the layout.";
                    alert(errMsg);
                }
                else {
                    console.log("Number of Text Spans: " + boxTextSpans.length);
                    //Iterate through all the Spans
                    for (let j = 0; j < boxTextSpans.length; j++) {
                        let spanChildren = boxTextSpans[j].childNodes;
                        if (null != spanChildren) {
                            for (let k = 0; k < spanChildren.length; k++) {
                                //Check if it is a text node
                                if (spanChildren[k].nodeType === 3) {
                                    //console.log("Node Value: " + spanChildren[k].nodeValue + ", Parent Node Type: : " + boxTextSpans[j].parentNode.nodeName);
                                    if (boxTextSpans[j].parentNode.nodeName.toLowerCase() === "qx-a") {//The text is already hyperlinked
                                        console.log(spanChildren[k].nodeValue + " is already hyperlinked");
                                    }
                                    else {//Text is NOT hyperlinked
                                        linkCount += changeToQuarkLinks(spanChildren[k].nodeValue, boxTextSpans[j]);
                                    }
                                }
                            }
                        }
                    }
                    errMsg = "Number of Hyperlinks Created: " + linkCount;
                }
            }
        }
        setTimeout(function () { console.log("Hyperlink conversion finished."); resolve(errMsg) }, 0)
    });
    return promise;
}

function changeToQuarkLinks(nStr, spanNode) //, bMails, bUrls, bIps, bFiles)
{
    //Convert all Links using the external library
    let linkedText = anchorme(nStr, { emails: linkMails, urls: linkUrls, ips: linkIPs, files: linkFiles });
    let newNodes = []; //Store new nodes created from String
    let countLinks = 0;

    if (linkedText != nStr) {//Only if some links were created
        //Create an Empty Span with all Attributes - Remove all child nodes
        let qxEmptySpan = spanNode.cloneNode(true);
        //Remove Child Nodes
        while (qxEmptySpan.hasChildNodes()) {
            qxEmptySpan.removeChild(qxEmptySpan.lastChild);
        }
        //console.log("Empty Span Node: " + qxEmptySpan.outerHTML);

        //Create a temporary div to convert the String to Nodes
        div = document.createElement('div');
        div.innerHTML = linkedText;
        let divChildren = div.childNodes;
        for (let k = 0; k < divChildren.length; k++) {
            //console.log("Node Name: '" + divChildren[k].nodeName + "', Node Value: '" + divChildren[k].nodeValue + "'");

            //Create qx-span tags from text nodes
            if (divChildren[k].nodeType === 3) {//text node				
                //Clone the Empty Span to inherit all the attributes
                let qxSpan = qxEmptySpan.cloneNode(true);
                //Get text from the current node
                let qxSpanText = document.createTextNode(divChildren[k].nodeValue);
                //Add the text to this node
                qxSpan.appendChild(qxSpanText);
                //Store the node in array
                newNodes.push(qxSpan);
            }
            else if (divChildren[k].nodeName.toLowerCase() === "a") {//Anchor node
                //Create corresponding "qx-a" node
                let qxAnchor = document.createElement("qx-a");
                qxAnchor.setAttribute("href", divChildren[k].getAttribute("href"));
                qxAnchor.setAttribute("title", divChildren[k].getAttribute("href"));

                //Clone the Empty Span to inherit all the attributes
                let qxSpan = qxEmptySpan.cloneNode(true);
                //Get text from the current node
                let qxSpanText = document.createTextNode(divChildren[k].textContent);
                //Add the text to this node
                qxSpan.appendChild(qxSpanText);

                //Append the Text Span inside Anchor
                qxAnchor.appendChild(qxSpan);

                //Store the node in array
                newNodes.push(qxAnchor);
                console.log("Created Hyperlink: " + qxAnchor.outerHTML + " on page " + spanNode.parentNode.parentNode.parentNode.style.qxPage);
                //Increase the Counter
                countLinks++;
            }
            else {
                alert("Error: Unhandled Node Type : " + divChildren[k].nodeName);
            }
        }

        //Append all the Nodes Created Above
        for (n = 0; n < newNodes.length; n++) {
            spanNode.parentNode.insertBefore(newNodes[n], spanNode);
        }
        spanNode.remove();
    }
    else {
        //console.log ("No hyperlinks found in: " + nStr);
    }
    return countLinks;
}
