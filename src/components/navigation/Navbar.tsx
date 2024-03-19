import { useState } from 'react';
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const Navbar = () => {
    // State for the dropdown menu visibility
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow" style={{ width: '80vw', borderRadius: '0 0 10px 10px' }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8" style={{ paddingLeft: '0', paddingRight: '0' }}>
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <img className="h-8 w-auto" src="/logo.png" alt="Your Logo" style={{ width: '80px', height: '80px', marginLeft: '0' }}/>
                        <div className="ml-6">
                            <input
                                type="search"
                                placeholder="Search..."
                                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="hidden sm:flex sm:space-x-4">
                            <a href="#" className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium" aria-current="page">Home</a>
                            <a href="#" className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Classes</a>
                            <a href="#" className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Tasks</a>
                            <div className="relative">
                                <button onClick={toggleDropdown} className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                    Tools
                                    <span className="ml-2">&#x25bc;</span>
                                    {isDropdownOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Tool 1</a>
                                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Tool 2</a>
                                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Tool 3</a>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button className="bg-green-500 text-white active:bg-green-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1" type="button" style={{ transition: "all .15s ease" }}>
                            + NEW
                        </button>
                        <div className="ml-3 relative">
                            <span className="absolute right-0 top-0 rounded-full bg-red-500 h-3 w-3"></span>
                            {/* <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar> */}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );        
};

export default Navbar;
