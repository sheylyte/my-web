/* =========================================================
   LARCK PARTY ROOM
   PAGE 6 JAVASCRIPT
========================================================= */


/* =========================================================
   LARCK SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://hxtwdzvnqtxoutdetfoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hEot0ds6XIcLYo7Fj8xtUQ_0ICFxMBV";

const larckSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   LOAD REAL ROOM
========================================================= */

async function loadRealRoom() {

    try {

        /* GET ROOM ID FROM URL */

        const urlParams =
            new URLSearchParams(
                window.location.search
            );

        const roomId =
            urlParams.get("roomId");


        if (!roomId) {

            console.error(
                "No room ID found in URL."
            );

            return;
        }


        /* GET REAL ROOM FROM SUPABASE */

        const {
            data: room,
            error: roomError
        } = await larckSupabase
            .from("rooms")
            .select(`
                id,
                name,
                room_id,
                owner_id,
                profiles:owner_id (
                    username,
                    larck_id,
                    profile_picture,
                    country
                )
            `)
            .eq("id", roomId)
            .single();


        if (roomError || !room) {

            console.error(
                "Room loading error:",
                roomError
            );

            alert(
                "Unable to load this party room."
            );

            window.location.href =
                "page3.html";

            return;
        }


        /* =================================================
           ROOM HEADER
        ================================================= */

        const roomName =
            document.querySelector(
                ".room-profile-info h1"
            );

        const roomIdText =
            document.querySelector(
                ".room-profile-info span"
            );


        if (roomName) {

            roomName.textContent =
                room.name;

        }


        if (roomIdText) {

            roomIdText.textContent =
                "ID: " + room.room_id;

        }


        /* =================================================
           ROOM STAGE TITLE
        ================================================= */

        const stageTitle =
            document.querySelector(
                ".stage-title span"
            );


        if (stageTitle) {

            stageTitle.textContent =
                room.name;

        }


        /* =================================================
           REAL ROOM OWNER
        ================================================= */

        if (room.profiles) {

            const ownerName =
                document.querySelector(
                    ".host-name"
                );


            if (ownerName) {

                ownerName.textContent =
                    "🎤 " +
                    room.profiles.username;

            }


            /* OWNER PROFILE PICTURE */

            const ownerImages =
                document.querySelectorAll(
                    ".room-profile-picture img, .host-ring img"
                );


            if (
                room.profiles.profile_picture &&
                room.profiles.profile_picture.trim() !== ""
            ) {

                ownerImages.forEach(
                    function (image) {

                        image.src =
                            room.profiles.profile_picture;

                    }
                );

            }

        }


        /* =================================================
           SAVE ROOM INFORMATION
        ================================================= */

        window.larckCurrentRoom =
    room;

if (typeof loadExistingRoomMembers === "function") {
    await loadExistingRoomMembers();
}

if (typeof startRoomMembersRealtime === "function") {
    startRoomMembersRealtime();
}
            


        console.log(
            "REAL LARCK ROOM:",
            room
        );

        console.log(
            "PUBLIC ROOM ID:",
            room.room_id
        );

    }

    catch (error) {

        console.error(
            "Load room error:",
            error
        );

    }

}


/* LOAD ROOM */

loadRealRoom();



/* =========================================================
   HEADER
========================================================= */

const roomBack = document.getElementById("roomBack");
const exitRoom = document.getElementById("exitRoom");
const roomMenu = document.getElementById("roomMenu");

async function leaveRealRoom() {

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (!user || !window.larckCurrentRoom) {
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;

    const {
        error
    } = await larckSupabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Error leaving room:",
            error
        );

        return;
    }

    console.log(
        "User left the room and released their seat."
    );
}


roomBack.addEventListener("click", async function () {

    await leaveRealRoom();

    window.location.href = "page3.html";
});


exitRoom.addEventListener("click", async function () {

    const leaveRoom =
        confirm(
            "Do you want to leave this room?"
        );

    if (!leaveRoom) {
        return;
    }

    await leaveRealRoom();

    window.location.href =
        "page3.html";
});


roomMenu.addEventListener("click", function () {
    openTools();
});


/* =========================================================
   SEAT SYSTEM
========================================================= */

const seatArea = document.getElementById("seatArea");

const sampleUsers = [

    {
        name: "David",
        image: "images/user1.jpg",
        gifts: 0
    },

    {
        name: "Sarah",
        image: "images/user2.jpg",
        gifts: 0
    },

    {
        name: "Mike",
        image: "images/user3.jpg",
        gifts: 0
    },

    {
        name: "Linda",
        image: "images/user4.jpg",
        gifts: 0
    }

];


let nextUserIndex = 0;


/* =========================================================
   CURRENT SEAT COUNT
========================================================= */

let currentSeatCount = 15;

let pendingSeatCount = 15;


/* =========================================================
   CREATE SEAT
========================================================= */

function createSeat(number) {

    const seat = document.createElement("div");

    seat.className = "seat";

    seat.dataset.seat = number;

    seat.dataset.occupied = "false";


    seat.innerHTML = `
        <div class="seat-circle">
            <span class="seat-microphone">🎤</span>
        </div>

        <span class="mic-indicator">🎤</span>
    `;


    seat.addEventListener("click", async function () {

        /* OCCUPIED SEAT */
        if (seat.dataset.occupied === "true") {

            return;
        }


        /* CURRENT USER MUST BE LOGGED IN */

        const {
            data: {
                user
            }
        } = await larckSupabase.auth.getUser();


        if (!user) {

            alert("Please sign in first.");

            return;
        }


        /* ROOM MUST BE LOADED */

        if (!window.larckCurrentRoom) {

            console.log(
                "Room is still loading."
            );

            return;
        }


        const roomId =
            window.larckCurrentRoom.id;


        /* CHECK IF THIS USER IS ALREADY SITTING */

        const {
            data: existingMember,
            error: existingError
        } = await larckSupabase
            .from("room_members")
            .select(`
                id,
                seat_number
            `)
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();


        if (existingError) {

            console.error(
                "Member check error:",
                existingError
            );

            return;
        }


        /* USER ALREADY HAS A SEAT */

        if (existingMember) {

            alert(
                "You are already sitting on seat " +
                existingMember.seat_number +
                "."
            );

            return;
        }


        /* CHECK WHETHER THIS SEAT IS ALREADY TAKEN
           IN SUPABASE */

        const {
            data: seatMember,
            error: seatError
        } = await larckSupabase
            .from("room_members")
            .select(`
                id,
                user_id
            `)
            .eq("room_id", roomId)
            .eq(
                "seat_number",
                number
            )
            .eq("is_active", true)
            .maybeSingle();


        if (seatError) {

            console.error(
                "Seat check error:",
                seatError
            );

            return;
        }


        /* SOMEONE ELSE JUST TOOK THIS SEAT */

        if (seatMember) {

            alert(
                "This seat is already occupied."
            );

            return;
        }


        /* GET CURRENT USER PROFILE */

        const {
            data: profile,
            error: profileError
        } = await larckSupabase
            .from("profiles")
            .select(`
                username,
                profile_picture
            `)
            .eq("id", user.id)
            .single();


        if (profileError || !profile) {

            console.error(
                "Profile loading error:",
                profileError
            );

            return;
        }


        /* SAVE THE SEAT */

        const {
            data: newMember,
            error: joinError
        } = await larckSupabase
            .from("room_members")
            .insert({

                room_id: roomId,

                user_id: user.id,

                seat_number: number,

                mic_on: true,

                is_active: true

            })
            .select()
            .single();


        if (joinError) {

            console.error(
                "Seat join error:",
                joinError
            );

            alert(
                "This seat was just taken. Please choose another seat."
            );

            return;
        }


        /* SHOW USER ON THE SEAT */

        const circle =
            seat.querySelector(
                ".seat-circle"
            );


        circle.classList.add(
            "occupied"
        );


        if (
            profile.profile_picture &&
            profile.profile_picture.trim() !== ""
        ) {

            circle.innerHTML = `
                <img
                    src="${profile.profile_picture}"
                    alt="${profile.username}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                        display:block;
                    "
                >
            `;

        } else {

            circle.innerHTML = `
                <span>
                    ${profile.username
                        ? profile.username
                            .charAt(0)
                            .toUpperCase()
                        : "L"}
                </span>
            `;
        }


        const name =
            document.createElement(
                "span"
            );

        name.className =
            "seat-name";

        name.textContent =
            profile.username || "LARCK User";


        const giftBox =
            document.createElement(
                "span"
            );

        giftBox.className =
            "seat-gifts";

        giftBox.textContent =
            "🎁 0";


        seat.appendChild(name);

        seat.appendChild(giftBox);


        /* SAVE LOCAL SEAT STATE */

        seat.dataset.occupied =
            "true";

        seat.dataset.username =
            profile.username ||
            "LARCK User";

        seat.dataset.userId =
            user.id;

        seat.dataset.memberId =
            newMember.id;

        seat.dataset.gifts =
            "0";


        console.log(
            "User successfully sat on seat:",
            number
        );
    });

    return seat;
}

/* =========================================================
   CREATE ALL 30 SEATS
========================================================= */

for (let i = 1; i <= 30; i++) {

    const seat = createSeat(i);

    seatArea.appendChild(seat);

}


/* =========================================================
   GET ALL SEATS
========================================================= */

const seats = document.querySelectorAll(".seat");




/* =========================================================
   SIT ON SEAT
========================================================= */

function sitOnSeat(seat, user) {

    const circle = seat.querySelector(".seat-circle");


    circle.classList.add("occupied");


    circle.innerHTML = `
        <img src="${user.image}" alt="${user.name}">
    `;


    const oldName = seat.querySelector(".seat-name");

    const oldGift = seat.querySelector(".seat-gifts");


    if (oldName) {
        oldName.remove();
    }


    if (oldGift) {
        oldGift.remove();
    }


    const name = document.createElement("span");

    name.className = "seat-name";

    name.textContent = user.name;


    const giftBox = document.createElement("span");

    giftBox.className = "seat-gifts";

    giftBox.textContent = `🎁 ${user.gifts}`;


    seat.appendChild(name);

    seat.appendChild(giftBox);


    seat.dataset.occupied = "true";

    seat.dataset.username = user.name;

    seat.dataset.gifts = user.gifts;

}


/* =========================================================
   LEAVE SEAT
========================================================= */

function leaveSeat(seat) {

    const circle = seat.querySelector(".seat-circle");


    circle.classList.remove("occupied");


    circle.innerHTML = `
        <span class="seat-microphone">🎤</span>
    `;


    const name = seat.querySelector(".seat-name");

    const gift = seat.querySelector(".seat-gifts");


    if (name) {
        name.remove();
    }


    if (gift) {
        gift.remove();
    }


    seat.dataset.occupied = "false";

    delete seat.dataset.username;

    delete seat.dataset.gifts;

}


/* =========================================================
   QUICK SEAT LAYOUT
========================================================= */

function updateSeatLayout(count) {

    currentSeatCount = count;


    /* =====================================================
       SHOW ONLY THE SELECTED NUMBER OF SEATS
    ===================================================== */

    seats.forEach(function (seat, index) {

        if (index < count) {

            seat.style.display = "block";

        } else {

            seat.style.display = "none";

        }

    });


    /* =====================================================
       DEFAULT LAYOUT
    ===================================================== */

    let columns = 5;
    let rowGap = 6;
    let stageHeight = 275;


    /* =====================================================
       10 SEATS
    ===================================================== */

    if (count === 10) {

        columns = 5;
        rowGap = 8;
        stageHeight = 185;

    }


    /* =====================================================
       15 SEATS
    ===================================================== */

    if (count === 15) {

        columns = 5;
        rowGap = 6;
        stageHeight = 250;

    }


    /* =====================================================
       20 SEATS
    ===================================================== */

    if (count === 20) {

        columns = 5;
        rowGap = 4;
        stageHeight = 300;

    }


    /* =====================================================
       30 SEATS
    ===================================================== */

    if (count === 30) {

        columns = 5;
        rowGap = 2;
        stageHeight = 365;

    }


    /* =====================================================
       APPLY GRID
    ===================================================== */

    seatArea.style.gridTemplateColumns =
        `repeat(${columns}, 1fr)`;

    seatArea.style.rowGap =
        `${rowGap}px`;


    /* =====================================================
       RESET LAST ROW
    ===================================================== */

    seats.forEach(function (seat) {

        seat.style.gridColumn = "auto";

    });


    /* =====================================================
       CENTER LAST 3 SEATS FOR 15
    ===================================================== */

    if (count === 15) {

        seats[12].style.gridColumn = "2";

        seats[13].style.gridColumn = "3";

        seats[14].style.gridColumn = "4";

    }


    /* =====================================================
       UPDATE ROOM STAGE
    ===================================================== */

    const roomStage =
        document.querySelector(".room-stage");

    roomStage.style.height =
        `${stageHeight}px`;


    /* =====================================================
       UPDATE CHAT POSITION
    ===================================================== */

    const liveChat =
        document.querySelector(".live-chat");


    /*
       Put the chat immediately below the stage.
       This prevents the 30-seat layout from covering it.
    */

    const chatGap = 6;

    const chatTop =
        64 + stageHeight + chatGap;


    liveChat.style.top =
        `${chatTop}px`;


    /*
       Keep enough room for the chat.
    */

    liveChat.style.bottom = "94px";


    /* =====================================================
       UPDATE SETUP TEXT
    ===================================================== */

    const seatLayoutText =
        document.getElementById("seatLayoutText");

    seatLayoutText.textContent =
        `${count} seats⌄`;

}


/* =========================================================
   INITIAL 15-SEAT ROOM
========================================================= */

updateSeatLayout(15);


/* =========================================================
   MICROPHONE
========================================================= */

const micButton = document.getElementById("micButton");

let microphoneOn = true;


micButton.addEventListener("click", function () {

    microphoneOn = !microphoneOn;


    const svg = micButton.querySelector("svg");


    if (microphoneOn) {

        micButton.classList.add("active-control");

        svg.style.opacity = "1";

    } else {

        micButton.classList.remove("active-control");

        svg.style.opacity = ".4";

    }

});


/* =========================================================
   SPEAKER
========================================================= */

const speakerButton =
    document.getElementById("speakerButton");

let speakerOn = true;


speakerButton.addEventListener("click", function () {

    speakerOn = !speakerOn;


    const svg = speakerButton.querySelector("svg");


    if (speakerOn) {

        speakerButton.classList.add("active-control");

        svg.style.opacity = "1";

    } else {

        speakerButton.classList.remove("active-control");

        svg.style.opacity = ".4";

    }

});

/* =========================================================
   LIVE CHAT
========================================================= */

const chatInput =
    document.getElementById("chatInput");

const sendChat =
    document.getElementById("sendChat");

const chatMessages =
    document.getElementById("chatMessages");


/* =========================================================
   ROOM JOIN MESSAGE
========================================================= */

function addJoinMessage(username) {

    const row =
        document.createElement("div");

    row.className =
        "room-welcome";


    const welcomeText =
        document.createElement("strong");

    welcomeText.textContent =
        `Welcome @${username}`;


    row.appendChild(welcomeText);

    chatMessages.appendChild(row);


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================================================
   SIMULATE USER JOINING ROOM
========================================================= */

addJoinMessage("Seyi");


/* =========================================================
   SEND CHAT MESSAGE
========================================================= */

function sendMessage() {

    const message =
        chatInput.value.trim();


    if (message === "") {
        return;
    }


    const row =
        document.createElement("div");


    row.className =
        "message-row";


    const username =
        document.createElement("strong");


    username.textContent =
        "You";


    const messageText =
        document.createElement("span");


    messageText.textContent =
        message;


    row.appendChild(username);

    row.appendChild(messageText);


    chatMessages.appendChild(row);


    chatInput.value = "";


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


sendChat.addEventListener(
    "click",
    sendMessage
);


chatInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);

/* =========================================================
   GIFT
========================================================= */

const giftButton =
    document.getElementById("giftButton");


giftButton.addEventListener(
    "click",
    function () {

        alert(
            "Gift Center\n\n" +
            "Choose a gift to send to the host or a member."
        );

    }
);


/* =========================================================
   GAMES
========================================================= */

const gamesButton =
    document.getElementById("gamesButton");

const gamesPanel =
    document.getElementById("gamesPanel");

const gamesOverlay =
    document.getElementById("gamesOverlay");

const closeGames =
    document.getElementById("closeGames");


function openGames() {

    gamesPanel.classList.add("show");

    gamesOverlay.classList.add("show");

}


function closeGamesPanel() {

    gamesPanel.classList.remove("show");

    gamesOverlay.classList.remove("show");

}


gamesButton.addEventListener(
    "click",
    openGames
);


closeGames.addEventListener(
    "click",
    closeGamesPanel
);


gamesOverlay.addEventListener(
    "click",
    closeGamesPanel
);


/* =========================================================
   GAME CARDS
========================================================= */

const gameCards =
    document.querySelectorAll(".game-card");


gameCards.forEach(function (game) {

    game.addEventListener(
        "click",
        function () {

            const gameName =
                game.dataset.game;


            alert(
                gameName +
                "\n\nThe " +
                gameName +
                " game will open here."
            );

        }
    );

});


/* =========================================================
   MORE TOOLS
========================================================= */

const moreButton =
    document.getElementById("moreButton");

const toolsPanel =
    document.getElementById("toolsPanel");

const toolsOverlay =
    document.getElementById("toolsOverlay");

const closeTools =
    document.getElementById("closeTools");

const saveTools =
    document.getElementById("saveTools");


function openTools() {

    toolsPanel.classList.add("show");

    toolsOverlay.classList.add("show");

}


function closeToolsPanel() {

    toolsPanel.classList.remove("show");

    toolsOverlay.classList.remove("show");

}


moreButton.addEventListener(
    "click",
    openTools
);


closeTools.addEventListener(
    "click",
    closeToolsPanel
);


toolsOverlay.addEventListener(
    "click",
    closeToolsPanel
);

/* =========================================================
   LOCK ROOM
========================================================= */

const lockRoomButton =
    document.getElementById("lockRoomButton");

const roomLockedIndicator =
    document.getElementById("roomLockedIndicator");

let roomLocked = false;


lockRoomButton.addEventListener(
    "click",
    function () {

        roomLocked = !roomLocked;


        /* =================================================
           LOCK ROOM
        ================================================= */

        if (roomLocked) {

            roomLockedIndicator.classList.add("show");


            lockRoomButton.querySelector(".tool-icon")
                .textContent = "🔓";


            lockRoomButton.querySelector(
                "span:last-child"
            ).textContent = "Unlock Room";


            lockRoomButton.classList.add(
                "locked-tool"
            );


            alert(
                "Room Locked\n\n" +
                "New users can no longer join this room."
            );

        }


        /* =================================================
           UNLOCK ROOM
        ================================================= */

        else {

            roomLockedIndicator.classList.remove(
                "show"
            );


            lockRoomButton.querySelector(".tool-icon")
                .textContent = "🔒";


            lockRoomButton.querySelector(
                "span:last-child"
            ).textContent = "Lock Room";


            lockRoomButton.classList.remove(
                "locked-tool"
            );


            alert(
                "Room Unlocked\n\n" +
                "New users can now join this room."
            );

        }

    }
);

/* =========================================================
   CLEAR SCREEN
========================================================= */

const clearScreenButton =
    document.getElementById("clearScreenButton");


clearScreenButton.addEventListener(
    "click",
    function () {

        /* =========================================
           CLEAR CHAT MESSAGES
        ========================================= */

        chatMessages.innerHTML = "";


        /* =========================================
           SHOW CLEAR CONFIRMATION
        ========================================= */

        const clearMessage =
            document.createElement("div");

        clearMessage.className =
            "clear-screen-message";

        clearMessage.textContent =
            "✓ Screen Cleared";


        document.querySelector(".party-room")
            .appendChild(clearMessage);


        /* =========================================
           SHOW MESSAGE
        ========================================= */

        setTimeout(function () {

            clearMessage.classList.add("show");

        }, 20);


        /* =========================================
           HIDE MESSAGE
        ========================================= */

        setTimeout(function () {

            clearMessage.classList.remove("show");

        }, 1500);


        /* =========================================
           REMOVE MESSAGE
        ========================================= */

        setTimeout(function () {

            clearMessage.remove();

        }, 1800);


        /* =========================================
           CLOSE MORE TOOLS
        ========================================= */

        closeToolsPanel();

    }
);

/* =========================================================
   BACKGROUND SETTINGS
========================================================= */

const backgroundSettingsButton =
    document.getElementById(
        "backgroundSettingsButton"
    );

const backgroundPanel =
    document.getElementById(
        "backgroundPanel"
    );

const backgroundOverlay =
    document.getElementById(
        "backgroundOverlay"
    );

const closeBackground =
    document.getElementById(
        "closeBackground"
    );

const applyBackground =
    document.getElementById(
        "applyBackground"
    );

const backgroundOptions =
    document.querySelectorAll(
        ".background-option"
    );

const backgroundPreviewBox =
    document.getElementById(
        "backgroundPreviewBox"
    );


/* =========================================================
   BACKGROUND DATA
========================================================= */

const backgroundStyles = {

    purple: `
        radial-gradient(
            circle at 50% 28%,
            rgba(104, 48, 170, .30),
            transparent 35%
        ),
        linear-gradient(
            180deg,
            #17102c 0%,
            #0d0820 100%
        )
    `,

    space: `
        radial-gradient(
            circle at 20% 25%,
            rgba(255,255,255,.8) 0 1px,
            transparent 2px
        ),
        radial-gradient(
            circle at 70% 45%,
            rgba(255,255,255,.7) 0 1px,
            transparent 2px
        ),
        radial-gradient(
            circle at 40% 75%,
            rgba(255,255,255,.5) 0 1px,
            transparent 2px
        ),
        linear-gradient(
            180deg,
            #10152d,
            #03040a
        )
    `,

    glow: `
        radial-gradient(
            circle at 50% 30%,
            rgba(141, 77, 224, .55),
            transparent 38%
        ),
        linear-gradient(
            180deg,
            #32145c,
            #090313
        )
    `,

    ocean: `
        radial-gradient(
            circle at 50% 28%,
            rgba(8, 127, 155, .45),
            transparent 40%
        ),
        linear-gradient(
            180deg,
            #062d46,
            #031017
        )
    `,

    red: `
        radial-gradient(
            circle at 50% 28%,
            rgba(154, 41, 41, .45),
            transparent 40%
        ),
        linear-gradient(
            180deg,
            #431515,
            #100606
        )
    `,

    midnight: `
        radial-gradient(
            circle at 50% 30%,
            rgba(48, 48, 82, .45),
            transparent 40%
        ),
        linear-gradient(
            180deg,
            #11111d,
            #030307
        )
    `

};


let selectedBackground = "purple";


/* =========================================================
   OPEN BACKGROUND SETTINGS
========================================================= */

backgroundSettingsButton.addEventListener(
    "click",
    function () {

        backgroundPanel.classList.add("show");

        backgroundOverlay.classList.add("show");

    }
);


/* =========================================================
   CLOSE BACKGROUND SETTINGS
========================================================= */

function closeBackgroundPanel() {

    backgroundPanel.classList.remove("show");

    backgroundOverlay.classList.remove("show");

}


closeBackground.addEventListener(
    "click",
    closeBackgroundPanel
);


backgroundOverlay.addEventListener(
    "click",
    closeBackgroundPanel
);


/* =========================================================
   SELECT BACKGROUND
========================================================= */

backgroundOptions.forEach(
    function (option) {

        option.addEventListener(
            "click",
            function () {

                backgroundOptions.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                option.classList.add(
                    "active"
                );


                selectedBackground =
                    option.dataset.background;


                backgroundPreviewBox.style.background =
                    backgroundStyles[
                        selectedBackground
                    ];

            }
        );

    }
);


/* =========================================================
   APPLY BACKGROUND
========================================================= */

applyBackground.addEventListener(
    "click",
    function () {

        const partyRoom =
            document.querySelector(
                ".party-room"
            );


        partyRoom.style.background =
            backgroundStyles[
                selectedBackground
            ];


        closeBackgroundPanel();

    }
);

/* =========================================================
   QUICK SEAT SELECTION
========================================================= */

const seatOptions =
    document.querySelectorAll(".seat-option");


seatOptions.forEach(function (option) {

    option.addEventListener(
        "click",
        function () {

            seatOptions.forEach(
                function (item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            option.classList.add("active");


            pendingSeatCount =
                Number(option.dataset.seats);

        }
    );

});


/* =========================================================
   SAVE QUICK SEAT SELECTION
========================================================= */

saveTools.addEventListener(
    "click",
    function () {

        updateSeatLayout(
            pendingSeatCount
        );


        closeToolsPanel();

    }
);


/* =========================================================
   SETUP BUTTONS
========================================================= */

const micModeButton =
    document.getElementById("micModeButton");

const seatLayoutButton =
    document.getElementById("seatLayoutButton");


micModeButton.addEventListener(
    "click",
    function () {

        alert(
            "Mic Mode\n\n" +
            "Free Mic mode is currently selected."
        );

    }
);


seatLayoutButton.addEventListener(
    "click",
    function () {

        alert(
            "Seat Layout\n\n" +
            currentSeatCount +
            " seats are currently selected."
        );

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeToolsPanel();

            closeGamesPanel();

        }

    }
);


/* =========================================================
   ROOM LOADED
========================================================= */

console.log(
    "LARCK Party Room loaded successfully."
);

/* =========================================================
   EFFECT & MESSAGE SETTINGS
========================================================= */

const effectMessageButton =
    document.getElementById("effectMessageButton");

const effectMessagePanel =
    document.getElementById("effectMessagePanel");

const effectMessageOverlay =
    document.getElementById("effectMessageOverlay");

const closeEffectMessage =
    document.getElementById("closeEffectMessage");

const applyEffectMessage =
    document.getElementById("applyEffectMessage");

const effectOptions =
    document.querySelectorAll(".effect-option");


let selectedEffect = "normal";


/* OPEN */

effectMessageButton.addEventListener(
    "click",
    function () {

        effectMessagePanel.classList.add("show");

        effectMessageOverlay.classList.add("show");

    }
);


/* CLOSE */

function closeEffectMessagePanel() {

    effectMessagePanel.classList.remove("show");

    effectMessageOverlay.classList.remove("show");

}

closeEffectMessage.addEventListener(
    "click",
    closeEffectMessagePanel
);

effectMessageOverlay.addEventListener(
    "click",
    closeEffectMessagePanel
);


/* EFFECT SELECTION */

effectOptions.forEach(function(option) {

    option.addEventListener(
        "click",
        function() {

            effectOptions.forEach(
                function(item) {
                    item.classList.remove("active");
                }
            );

            option.classList.add("active");

            selectedEffect =
                option.dataset.effect;

        }
    );

});


/* SAVE */

applyEffectMessage.addEventListener(
    "click",
    function() {

        const joinMessages =
            document.getElementById(
                "joinMessagesToggle"
            ).checked;

        const leaveMessages =
            document.getElementById(
                "leaveMessagesToggle"
            ).checked;

        const systemMessages =
            document.getElementById(
                "systemMessagesToggle"
            ).checked;

        const giftEffects =
            document.getElementById(
                "giftEffectsToggle"
            ).checked;


        console.log(
            "Effect:",
            selectedEffect
        );

        console.log(
            "Join Messages:",
            joinMessages
        );

        console.log(
            "Leave Messages:",
            leaveMessages
        );

        console.log(
            "System Messages:",
            systemMessages
        );

        console.log(
            "Gift Effects:",
            giftEffects
        );


        closeEffectMessagePanel();

        alert(
            "Settings Saved\n\n" +
            "Effect: " +
            selectedEffect
        );

    }
);

/* =========================================================
   REALTIME ROOM MEMBERS
========================================================= */

function startRoomMembersRealtime() {

    if (!window.larckCurrentRoom) {
        console.log(
            "Realtime waiting for room..."
        );
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;


    larckSupabase
        .channel(
            "room-members-" + roomId
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "room_members",
                filter:
                    "room_id=eq." + roomId
            },

            async function (payload) {

                console.log(
                    "ROOM MEMBER CHANGE:",
                    payload
                );


                /* NEW MEMBER */

                if (payload.eventType === "INSERT") {

                    await showRealtimeMember(
                        payload.new
                    );
                }


                /* MEMBER LEFT */

                if (payload.eventType === "DELETE") {

                    removeRealtimeMember(
                        payload.old
                    );
                }


                /* MEMBER UPDATED */

                if (payload.eventType === "UPDATE") {

                    await refreshRealtimeMember(
                        payload.new
                    );
                }

            }
        )

        .subscribe(function (status) {

            console.log(
                "ROOM REALTIME:",
                status
            );

        });
}


/* =========================================================
   SHOW NEW MEMBER
========================================================= */

async function showRealtimeMember(member) {

    if (!member.is_active) {
        return;
    }


    const seat =
        document.querySelector(
            `.seat[data-seat="${member.seat_number}"]`
        );


    if (!seat) {
        return;
    }


    const {
        data: profile,
        error
    } = await larckSupabase
        .from("profiles")
        .select(`
            username,
            profile_picture
        `)
        .eq("id", member.user_id)
        .single();


    if (error || !profile) {

        console.error(
            "Realtime profile error:",
            error
        );

        return;
    }


    /* Do not overwrite an occupied seat */

    if (
        seat.dataset.occupied === "true" &&
        seat.dataset.userId !== member.user_id
    ) {

        return;
    }


    const circle =
        seat.querySelector(
            ".seat-circle"
        );


    circle.classList.add(
        "occupied"
    );


    if (
        profile.profile_picture &&
        profile.profile_picture.trim() !== ""
    ) {

        circle.innerHTML = `
            <img
                src="${profile.profile_picture}"
                alt="${profile.username}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                    display:block;
                "
            >
        `;

    } else {

        circle.innerHTML = `
            <span>
                ${profile.username
                    ? profile.username
                        .charAt(0)
                        .toUpperCase()
                    : "L"}
            </span>
        `;
    }


    const oldName =
        seat.querySelector(
            ".seat-name"
        );

    const oldGift =
        seat.querySelector(
            ".seat-gifts"
        );


    if (oldName) {
        oldName.remove();
    }


    if (oldGift) {
        oldGift.remove();
    }


    const name =
        document.createElement(
            "span"
        );

    name.className =
        "seat-name";

    name.textContent =
        profile.username ||
        "LARCK User";


    const giftBox =
        document.createElement(
            "span"
        );

    giftBox.className =
        "seat-gifts";

    giftBox.textContent =
        "🎁 0";


    seat.appendChild(name);

    seat.appendChild(giftBox);


    seat.dataset.occupied =
        "true";

    seat.dataset.userId =
        member.user_id;

    seat.dataset.memberId =
        member.id;

    seat.dataset.username =
        profile.username ||
        "LARCK User";
}


/* =========================================================
   REMOVE MEMBER
========================================================= */

function removeRealtimeMember(member) {

    const seat =
        document.querySelector(
            `.seat[data-seat="${member.seat_number}"]`
        );


    if (!seat) {
        return;
    }


    /* Only clear if this member owns the seat */

    if (
        seat.dataset.userId !==
        member.user_id
    ) {

        return;
    }


    const circle =
        seat.querySelector(
            ".seat-circle"
        );


    circle.classList.remove(
        "occupied"
    );


    circle.innerHTML = `
        <span class="seat-microphone">
            🎤
        </span>
    `;


    const name =
        seat.querySelector(
            ".seat-name"
        );

    const gift =
        seat.querySelector(
            ".seat-gifts"
        );


    if (name) {
        name.remove();
    }


    if (gift) {
        gift.remove();
    }


    seat.dataset.occupied =
        "false";

    delete seat.dataset.userId;
    delete seat.dataset.memberId;
    delete seat.dataset.username;
}


/* =========================================================
   UPDATE MEMBER
========================================================= */

async function refreshRealtimeMember(member) {

    removeRealtimeMember(member);

    if (member.is_active) {

        await showRealtimeMember(
            member
        );
    }
}

/* =========================================================
   LOAD MEMBERS ALREADY IN THE ROOM
========================================================= */

async function loadExistingRoomMembers() {

    if (!window.larckCurrentRoom) {
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;

    const {
        data: members,
        error
    } = await larckSupabase
        .from("room_members")
        .select(`
            id,
            room_id,
            user_id,
            seat_number,
            mic_on,
            is_active
        `)
        .eq("room_id", roomId)
        .eq("is_active", true)
        .order("seat_number", {
            ascending: true
        });

    if (error) {
        console.error(
            "Existing members loading error:",
            error
        );
        return;
    }

    console.log(
        "EXISTING ROOM MEMBERS:",
        members
    );

    for (const member of members) {

        await showRealtimeMember(member);

    }
}