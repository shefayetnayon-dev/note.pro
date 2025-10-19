"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className='container max-w-7xl mx-auto py-4'>
            <header className='flex justify-between items-center'>
                <div className='logo w-24 md:w-28'>
                    <Image
                        src="next.svg"
                        width={100}
                        height={100}
                        alt="Picture of the nextjs"
                        className='w-full h-auto'
                    />
                </div>

                {/* Desktop Navigation */}
                <nav className='hidden md:block'>
                    <ul className='flex justify-center gap-5 lg:gap-8'>
                        <li className='nav-item'>
                            <Link href='/' className='relative group'>
                                Home
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/about' className='relative group'>
                                About Me
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/service' className='relative group'>
                                Services
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/portfolio' className='relative group'>
                                Portfolio
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/blog' className='relative group'>
                                Blog
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/contact' className='relative group'>
                                Contact Me
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className='hidden md:block'>
                    <button className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300'>
                        <Link href='/contact'>Hire Me</Link>
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className='md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5'
                    onClick={toggleMenu}
                    aria-label='Toggle menu'
                >
                    <span className={`block w-8 h-0.5 bg-gray-800 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`block w-8 h-0.5 bg-gray-800 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block w-8 h-0.5 bg-gray-800 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </button>
            </header>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-500 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <nav className='pt-6 pb-4'>
                    <ul className='flex flex-col gap-4'>
                        <li className='nav-item'>
                            <Link href='/' className='relative group block py-2' onClick={() => setIsMenuOpen(false)}>
                                Home
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/about' className='relative group block py-2' onClick={() => setIsMenuOpen(false)}>
                                About Me
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/service' className='relative group block py-2' onClick={() => setIsMenuOpen(false)}>
                                Services
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/portfolio' className='relative group block py-2' onClick={() => setIsMenuOpen(false)}>
                                Portfolio
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/blog' className='relative group block py-2' onClick={() => setIsMenuOpen(false)}>
                                Blog
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link href='/contact' className='relative group block py-2' onClick={() => setIsMenuOpen(false)}>
                                Contact Me
                                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full'></span>
                            </Link>
                        </li>
                        <li className='pt-2'>
                            <button className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300'>
                                <Link href='/contact' onClick={() => setIsMenuOpen(false)}>Hire Me</Link>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}