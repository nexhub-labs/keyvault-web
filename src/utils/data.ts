export { testimonials, features, heroTilted, faqs, type HeroTilted };

interface HeroTilted {
    icon: string;
    title: string;
    description: string;
}

const testimonials = [
    {
        name: "Alice Johnson",
        feedback: "KeyVault has revolutionized how I manage my passwords. It's secure, easy to use, and I can access it from anywhere!",
        avatar: "https://randomuser.me/api/portraits/women/41.jpg",
        office: {
            name: "cornix",
            locale: "",
            position: "md/ceo",
            icon: "https://static.thenounproject.com/png/1902233-512.png",
        },
    },
    {
        name: "Michael Ron",
        feedback: "I love the strong password generator feature. It gives me peace of mind knowing that my accounts are secure.",
        avatar: "https://randomuser.me/api/portraits/men/62.jpg",
        office: {
            name: "kaggle",
            locale: "",
            position: "cto",
            icon: "https://static.thenounproject.com/png/7162263-512.png",
        },
    },
    {
        name: "Sophia Martinez",
        feedback: "The interface is intuitive and the performance is top-notch. Highly recommend KeyVault for anyone looking to secure their digital life.",
        avatar: "https://randomuser.me/api/portraits/women/70.jpg",
        office: {
            name: "mezora",
            locale: "",
            position: "md/ceo",
            icon: "https://static.thenounproject.com/png/6620412-512.png",
        },
    },
    {
        name: "David Leonardo",
        feedback: "KeyVault has become an essential tool for my daily life. The ability to store and manage passkeys securely is fantastic.",
        avatar: "https://randomuser.me/api/portraits/men/88.jpg",
        office: {
            name: "sinclair",
            locale: "",
            position: "coo",
            icon: "https://static.thenounproject.com/png/7162263-512.png",
        },
    },
];

const features = [
    {
        title: "Secure Password Storage",
        description: "Store your passwords securely with end-to-end encryption. Access them anytime, anywhere with confidence.",
        image: "https://images.unsplash.com/photo-1573497491208-6b1acb260507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDF8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400"
    },
    {
        title: "Strong Password Generator",
        description: "Generate strong, unique passwords for all your accounts. Ensure your online security with robust passwords.",
        image: "https://images.unsplash.com/photo-1584433144859-1fc0a6251c4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDJ8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400"
    },
    {
        title: "Cross-Platform Access",
        description: "Access your passwords and passkeys across multiple devices. Enjoy seamless synchronization and convenience.",
        image: "https://images.unsplash.com/photo-1584697964407-5f1a5c6e62a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDl8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400"
    },
    {
        title: "User-Friendly Interface",
        description: "Navigate through our intuitive and user-friendly interface. Experience hassle-free password management.",
        image: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDMyfHx1c2VyJTIwaW50ZXJmYWNlfGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400"
    },
];

const heroTilted: HeroTilted[] = [
    {
        title: "Secure Password Storage",
        description: "Store your passwords securely with end-to-end encryption. Access them anytime, anywhere with confidence.",
        icon: "https://images.unsplash.com/photo-1573497491208-6b1acb260507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDF8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400",
    },
    {
        title: "Strong Password Generator",
        description: "Generate strong, unique passwords for all your accounts. Ensure your online security with robust passwords.",
        icon: "https://images.unsplash.com/photo-1573497491208-6b1acb260507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDF8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400",
    },
    {
        title: "Cross-Platform Access",
        description: "Access your passwords and passkeys across multiple devices. Enjoy seamless synchronization and convenience.",
        icon: "https://images.unsplash.com/photo-1573497491208-6b1acb260507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDF8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400",
    },
    {
        title: "User-Friendly Interface",
        description: "Navigate through our intuitive and user-friendly interface. Experience hassle-free password management.",
        icon: "https://images.unsplash.com/photo-1573497491208-6b1acb260507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDF8fHNlY3VyaXR5fGVufDB8fHx8MTY4MDY4NzA4Mw&ixlib=rb-1.2.1&q=80&w=400",
    },
];

const faqs = [
    {
        title: "What makes KeyVault different from other managers?",
        text: "KeyVault is built on a zero-knowledge, client-side-first architecture. This means your master password never leaves your device, and we use AES-GCM 256-bit encryption to ensure that only you hold the keys to your digital legacy.",
        image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTM2fHx0ZWNofGVufDB8fDB8fHww",
    },
    {
        title: "Is my data secure if KeyVault's servers are breached?",
        text: "Yes. Because we use end-to-end encryption with AES-GCM, any data stored on our servers is unreadable without your Master Key. Even if our database was compromised, your passwords remain secure behind robust mathematical barriers.",
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fHRlY2h8ZW58MHx8MHx8fDA%3D",
    },
    {
        title: "What happens if I forget my master password?",
        text: "We offer world-class recovery options. You can use your 256-bit Master Seed (Recovery Key) or our unique 'Trusted Contacts' system, which allows you to reconstruct your vault key through a decentralized process with friends you trust.",
        image: "https://images.unsplash.com/photo-1480506132288-68f7705954bd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE5fHx0ZWNofGVufDB8fDB8fHww",
    },
    {
        title: "How does 'Trusted Contacts' recovery work?",
        text: "Your Master Seed is divided into encrypted shards shared with contacts you choose. To recover your vault, a quorum of these contacts must approve your request, allowing the app to reconstruct your key without us ever seeing it.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fHRlY2h8ZW58MHx8MHx8fDA%3D",
    },
    {
        title: "Do you own or sell my data?",
        text: "Never. Your data belongs entirely to you. Our zero-knowledge protocol ensures we literally cannot see your data, let alone sell it. Our business is securing your privacy, not profiting from it.",
        image: "https://plus.unsplash.com/premium_photo-1666997726532-33f671ca24c8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMzfHx0ZWNofGVufDB8fDB8fHww",
    }
];
