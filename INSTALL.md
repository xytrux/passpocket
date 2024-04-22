# Installation Guide

This guide will help you get PassPocket up and running on your local machine for development and testing purposes.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installing

1. Clone the repository to your local machine:

```sh
git clone https://github.com/Xytrux/passpocket.git
cd passpocket
```
2. Install the project dependencies:

```sh
npm install
```

## Running the Application
To build the application for Windows, run:

```sh
npm start
```

## Building the Application
To build the application for Windows, run:

```sh
npm run package
```

To build the application specifically for Linux, run:

```sh
npm run package-linux
```

The built application will be located in the same directory.

## Building DEB and RPM packages
To make the packages for Linux, run:
```sh
npm run dist -- --linux
```

## Building installer for Windows
To make the installer for Windows, run:

```sh
npm run dist
```