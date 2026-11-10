/**
 * Giftly — клієнтська логіка.
 * 1. Каталог та кошик
 * 2. Переклад українською / англійською
 * 3. Анкета персоналізації (демо, локальне збереження)
 * 4. Оформлення замовлення через окремий Node.js сервер
 *
 * GitHub Pages: демонстраційний режим, без реальних платежів.
 */

const products = {
  S: { id: "S", name: "Giftly S", price: 999, description: "Маленький знак великої уваги" },
  M: { id: "M", name: "Giftly M", price: 1599, description: "Той самий особливий баланс" },
  L: { id: "L", name: "Giftly L", price: 2499, description: "Більше простору для вражень" }
};
let cart = JSON.parse(localStorage.getItem("giftly-cart") || "{}");
let lang = "uk";
const $ = (id) => document.getElementById(id);
const money = (n) => `${n.toLocaleString("uk-UA")} ₴`;
// Тексти для перемикання мови.
const i18n = {
  en: {
    announcement:"Thoughtful gifting, down to the details ✦ Delivery across Ukraine",navCatalog:"Shop",navHow:"How it works",navAbout:"Our story",navReviews:"Kind words",navContacts:"Contact",cart:"Bag",
    heroEyebrow:"THE ART OF GIVING",heroTitle:"A gift that<br><em>understands</em> them.",heroText:"Tell us a little about someone special — we’ll create a personalized gift box where every detail has meaning.",heroCta:"Explore gifts",heroSecondary:"How it works",heroNote:"Thoughtfully made. Personal to them.",floatingText:"Something special —<br>in every detail",
    trust1:"Curated around interests",trust2:"Three thoughtful budgets",trust3:"Delivery across Ukraine",trust4:"Beautifully wrapped",catalogEyebrow:"THE GIFT EDIT",catalogTitle:"Find your <em>format</em>",catalogIntro:"Three sizes, countless ways to say “I thought of you”. We tailor the contents to the recipient’s profile and your wishes.",productS:"A little token of a lot of love",productM:"The perfect thoughtful balance",productL:"More room for delight",bestseller:"Bestseller",addToCart:"Add to bag",catalogFootnote:"* Final contents depend on the recipient questionnaire, product availability and agreed preferences.",
    personalEyebrow:"NOT JUST A BOX",personalTitle:"No need to guess.<br><em>We’ll help.</em>",personalText:"You know the person, but not what to give them? Share a few details — we’ll use them to guide a thoughtful selection.",step1:"Choose your gift budget",step2:"Tell us about the recipient",step3:"We curate and wrap the box",quizCta:"Fill in the questionnaire",
    quoteEyebrow:"A LITTLE MORE THOUGHTFUL",quote:"“The best gift isn’t the most expensive one. It’s the one that makes someone feel seen.”",valuesEyebrow:"THE GIFTLY DIFFERENCE",valuesTitle:"Thoughtful down to the <em>details</em>",value1Title:"Personal approach",value1Text:"We consider interests, style, occasion and your budget.",value2Title:"A considered edit",value2Text:"We bring together items that create one harmonious experience.",value3Title:"Beautiful wrapping",value3Text:"A gift should feel special before it is even opened.",value4Title:"Easy from the start",value4Text:"A clear online journey, from choosing to delivery.",
    reviewsEyebrow:"KIND WORDS",reviewsTitle:"Warm words are <em>the best thank you</em>",reviewDisclaimer:"The reviews below are illustrative design examples. Replace them with genuine customer feedback after launch.",review1:"“I loved not having to search for every little thing myself. It came together as one thoughtful gift.”",review2:"“The questionnaire is such a good idea. I wanted a surprise and it helped me decide.”",review3:"“The packaging was a joy on its own. You can feel the attention to detail.”",
    ctaEyebrow:"MAKE SOMEONE'S DAY",ctaTitle:"Start with a thought<br>about <em>someone special.</em>",ctaButton:"Choose Giftly",footerTagline:"Personalized gifts, thoughtfully made for someone special.",footerExplore:"Explore",footerHelp:"Help",footerContact:"Contact",delivery:"Delivery & payment",contactUs:"Write to us",
    cartTitle:"Your bag",emptyCart:"Your bag is empty for now.",total:"Total",checkout:"Continue to checkout",shippingNote:"Nova Poshta delivery is paid separately by the customer.",
    quizEyebrow:"A FEW LITTLE DETAILS",quizTitle:"Tell us about the <em>recipient</em>",recipientAge:"Recipient’s age",occasion:"Occasion",interests:"Interests and hobbies",style:"Style / preferences",avoid:"Anything to avoid?",budget:"Preferred budget",sendQuiz:"Send preferences",quizPrivacy:"Please do not enter sensitive or unnecessary personal information. This questionnaire is currently a demo and does not submit data to a server.",
    checkoutEyebrow:"ALMOST YOURS",checkoutTitle:"Your <em>order</em>",fullName:"Full name",phone:"Phone number",email:"Email address",deliveryAddress:"City and Nova Poshta branch",personalNote:"Order notes",payButton:"Continue to WayForPay",checkoutNote:"Payment will be enabled after configuring your WayForPay merchant account and server keys."
  }
};
function t(key){return i18n[lang]?.[key] || document.querySelector(`[data-i18n="${key}"]`)?.dataset.uk || null;}
// Переклад інтерфейсу.
function setLanguage(next){
  lang=next;
  document.documentElement.lang=lang;
  $("langSwitch").textContent=lang==="uk"?"EN":"UA";
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    if(!el.dataset.uk) el.dataset.uk=el.innerHTML;
    el.innerHTML=lang==="en"?(i18n.en[el.dataset.i18n]||el.dataset.uk):el.dataset.uk;
  });
  renderCart();
}
function saveCart(){localStorage.setItem("giftly-cart",JSON.stringify(cart));renderCart();}
function total(){return Object.entries(cart).reduce((sum,[id,qty])=>sum+products[id].price*qty,0);}
// Оновлення кількості товарів та підсумкової суми.
function renderCart(){
  $("cartCount").textContent=Object.values(cart).reduce((a,b)=>a+b,0);
  $("cartTotal").textContent=money(total());
  $("checkoutTotal").textContent=money(total());
  const entries=Object.entries(cart).filter(([,q])=>q>0);
  $("cartItems").innerHTML=entries.length?entries.map(([id,qty])=>`<div class="cart-row"><div><strong>${products[id].name}</strong><small>${money(products[id].price)} · ${lang==="uk"?"персоналізований бокс":"personalized box"}</small></div><div class="qty-controls"><button data-qty="${id}" data-delta="-1">−</button><span>${qty}</span><button data-qty="${id}" data-delta="1">+</button></div></div>`).join(""):`<p class="empty-cart">${lang==="uk"?"Поки що тут порожньо.":"Your bag is empty for now."}</p>`;
  $("checkoutOpen").disabled=!entries.length;
  $("checkoutOpen").style.opacity=entries.length?1:.5;
}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400);}
function openCart(){$("cartOverlay").classList.add("open");$("cartDrawer").classList.add("open");}
function closeCart(){$("cartOverlay").classList.remove("open");$("cartDrawer").classList.remove("open");}
function openModal(id){$(id).classList.add("open");}
function closeModal(id){$(id).classList.remove("open");}
document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");
  if(add){const id=add.dataset.add;cart[id]=(cart[id]||0)+1;saveCart();toast(lang==="uk"?`${products[id].name} додано до кошика`:`${products[id].name} added to your bag`);}
  const qty=e.target.closest("[data-qty]");
  if(qty){const id=qty.dataset.qty;cart[id]+=Number(qty.dataset.delta);if(cart[id]<=0)delete cart[id];saveCart();}
  const close=e.target.closest("[data-close]");if(close)closeModal(close.dataset.close);
});
$("cartOpen").addEventListener("click",openCart);
$("cartClose").addEventListener("click",closeCart);
$("cartOverlay").addEventListener("click",closeCart);
$("checkoutOpen").addEventListener("click",()=>{closeCart();openModal("checkoutModal");});
$("quizOpen").addEventListener("click",()=>openModal("quizModal"));
$("langSwitch").addEventListener("click",()=>setLanguage(lang==="uk"?"en":"uk"));
$("menuToggle").addEventListener("click",()=>$("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
$("quizForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target).entries());
  localStorage.setItem("giftly-preferences",JSON.stringify(data));
  closeModal("quizModal");
  toast(lang==="uk"?"Дякуємо! Побажання збережено у цьому браузері.":"Thank you! Your preferences are saved in this browser.");
});
// Реальна оплата можлива лише на серверному хостингу з налаштованим WayForPay.
$("checkoutForm").addEventListener("submit",async e=>{
  if (location.hostname.endsWith("github.io") || location.protocol === "file:") {
    e.preventDefault();
    $("checkoutMessage").textContent = lang === "uk"
      ? "Це навчальна демонстрація на GitHub Pages. Онлайн-оплата недоступна."
      : "This is a GitHub Pages demo. Online payments are not available.";
    return;
  }
  e.preventDefault();
  const message=$("checkoutMessage");message.textContent=lang==="uk"?"Готуємо захищене перенаправлення до оплати…":"Preparing secure payment redirect…";
  const form=Object.fromEntries(new FormData(e.target).entries());
  try{
    const response=await fetch("/api/checkout/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer:form,items:Object.entries(cart).map(([id,quantity])=>({id,quantity}))})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Payment setup error");
    const paymentForm=document.createElement("form");paymentForm.method="POST";paymentForm.action=result.paymentUrl;
    Object.entries(result.fields).forEach(([key,value])=>{
      (Array.isArray(value)?value:[value]).forEach((item,index)=>{
        const input=document.createElement("input");input.type="hidden";input.name=Array.isArray(value)?`${key}[]`:key;input.value=item;paymentForm.appendChild(input);
      });
    });
    document.body.appendChild(paymentForm);paymentForm.submit();
  }catch(error){message.textContent=error.message;message.style.color="#9a594c";}
});
renderCart();
